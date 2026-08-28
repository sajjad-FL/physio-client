export default function ConsentModal({ open, onClose, onAccept, accepted, onToggle }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-subtle bg-white p-6 shadow-xl sm:p-8">
        <h2 className="type-page-title text-ink">Consent &amp; disclaimer</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
          <p>
            By booking a home visit, you understand that physiotherapy involves physical assessment and
            exercise. Inform your therapist of medical conditions, allergies, and recent surgeries.
          </p>
          <p>
            This platform connects you with independent professionals. We do not provide medical diagnosis or
            emergency care. For emergencies, contact local emergency services.
          </p>
          <p>
            Payments are processed securely; funds are held until your session is completed and released per
            platform policy.
          </p>
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onToggle(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand/30"
          />
          <span className="text-sm text-ink">I have read and agree to the terms above.</span>
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-4 py-2.5 text-sm font-medium text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!accepted}
            onClick={onAccept}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Continue booking
          </button>
        </div>
      </div>
    </div>
  )
}
