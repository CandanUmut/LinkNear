import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link
        to="/"
        className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-10 inline-block"
      >
        ← Home
      </Link>

      <p className="font-pixel text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
        Terms
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-[var(--text-primary)] leading-[1.05] mb-10">
        Terms of Service
      </h1>

      <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed space-y-6">
        <p className="text-sm text-[var(--text-tertiary)]">Last updated: 2026-04-04</p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">Who can use LinkNear</h2>
        <p>
          You must be at least 13 years old to use LinkNear. By creating an account you confirm
          that you meet this minimum age and that all information you provide is truthful.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">What you agree to</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>No harassment, hate speech, threats, or unwanted sexual advances.</li>
          <li>No spam or promotional messaging.</li>
          <li>No impersonation, fake profiles, or fraudulent identities.</li>
          <li>No solicitation of illegal activity.</li>
          <li>Respect the privacy of other users — don't screenshot, share, or repost their profiles without consent.</li>
        </ul>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">Enforcement</h2>
        <p>
          Violations of these rules can result in your account being suspended or terminated.
          Reports are reviewed by the LinkNear team. Severe or repeated violations may be reported
          to law enforcement.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">No warranty</h2>
        <p>
          LinkNear is provided as-is. We make no guarantees about availability, accuracy of
          profiles, or the behavior of other users. Meet in public places and use common sense
          when connecting with strangers.
        </p>

        <h2 className="font-display text-2xl text-[var(--text-primary)] mt-10 mb-3">Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of LinkNear after changes
          constitutes acceptance of the updated terms.
        </p>

        <p className="text-xs text-[var(--text-tertiary)] mt-12 pt-6 border-t border-[var(--border)]">
          This is a placeholder terms document for a pre-launch app. It will be replaced with
          legally-reviewed text before general availability.
        </p>
      </div>
    </div>
  )
}
