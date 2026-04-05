import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        to="/"
        className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-10 inline-block"
      >
        ← Home
      </Link>

      <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
        Policy
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-[var(--text-primary)] leading-[1.05] mb-10">
        Privacy Policy
      </h1>

      <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed space-y-6">
        <p className="text-sm text-[var(--text-tertiary)]">Last updated: 2026-04-04</p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">
          What we collect
        </h2>
        <p>
          LinkNear collects only the information you voluntarily provide when you create a profile:
          your name, headline, bio, skills, interests, what you're looking for, an optional avatar,
          and your approximate location. We use your email address for authentication and nothing
          else.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">
          How location works
        </h2>
        <p>
          We round your coordinates to roughly 100 meters of precision before storing them, and we
          never return raw coordinates to other users. Other users only see a computed distance
          ("2.3 km away"). You can turn off discovery at any time in Settings to become invisible.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">
          Who sees your data
        </h2>
        <p>
          Only signed-in LinkNear users can see your profile. Blocked users cannot see you. Your
          messages are visible only to the two participants of an accepted connection.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">
          Your rights
        </h2>
        <p>
          You can edit or delete your account at any time from Settings. Deletion is soft for 30
          days (so you can change your mind by signing back in) and then permanent.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">
          Contact
        </h2>
        <p>
          Questions about this policy? Open an issue on the{' '}
          <a
            href="https://github.com/candanumut/linknear"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] underline underline-offset-4"
          >
            LinkNear GitHub repository
          </a>
          .
        </p>

        <p className="text-xs text-[var(--text-tertiary)] mt-12 pt-6 border-t border-[var(--border)]">
          This is a placeholder privacy policy for a pre-launch app. It will be replaced with
          legally-reviewed text before general availability.
        </p>
      </div>
    </div>
  )
}
