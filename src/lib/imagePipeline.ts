/**
 * Client-side image processing pipeline for avatars.
 *
 * Rejects anything that isn't a safe, small, common image format and resizes
 * the survivor to a 512x512 max dimension WebP blob. Defense is in three
 * layers — here (UX + bandwidth), the Supabase Storage bucket policy
 * (5 MB cap), and the server-side CHECK constraints on any downstream table.
 */

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5_000_000 // 5 MB
const MAX_DIMENSION = 4096
const OUTPUT_DIMENSION = 512
const OUTPUT_QUALITY = 0.85

export interface ProcessedImage {
  blob: Blob
  extension: 'webp'
  mimeType: 'image/webp'
}

export class ImagePipelineError extends Error {
  code: 'bad_type' | 'too_large' | 'dimensions_exceed' | 'decode_failed' | 'encode_failed'
  constructor(code: ImagePipelineError['code'], message: string) {
    super(message)
    this.code = code
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImagePipelineError('decode_failed', 'Could not read image'))
    }
    img.src = url
  })
}

/**
 * Validate + compress an uploaded file into a 512x512 max WebP blob.
 * Throws an ImagePipelineError with a stable code on any failure.
 */
export async function validateAndCompress(file: File): Promise<ProcessedImage> {
  if (!file.type || !ALLOWED_MIME.includes(file.type)) {
    throw new ImagePipelineError(
      'bad_type',
      'Please upload a JPG, PNG, WebP, or GIF image.'
    )
  }
  if (file.size > MAX_BYTES) {
    throw new ImagePipelineError(
      'too_large',
      `Image is too large (${Math.round(file.size / 1024 / 1024)} MB). Max size is 5 MB.`
    )
  }

  const img = await loadImage(file)
  if (img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION) {
    throw new ImagePipelineError(
      'dimensions_exceed',
      `Image is too large (${img.naturalWidth}×${img.naturalHeight}). Max is ${MAX_DIMENSION}×${MAX_DIMENSION}.`
    )
  }

  // Compute scale to fit inside OUTPUT_DIMENSION preserving aspect ratio.
  const scale = Math.min(
    1,
    OUTPUT_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
  )
  const targetW = Math.round(img.naturalWidth * scale)
  const targetH = Math.round(img.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new ImagePipelineError('encode_failed', 'Your browser cannot process images.')
  }
  ctx.drawImage(img, 0, 0, targetW, targetH)

  const blob: Blob | null = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY)
  )
  if (!blob) {
    throw new ImagePipelineError('encode_failed', 'Failed to encode image')
  }

  return { blob, extension: 'webp', mimeType: 'image/webp' }
}
