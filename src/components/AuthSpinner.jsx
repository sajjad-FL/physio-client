export default function AuthSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-brand/30 border-t-brand"
        aria-hidden
      />
      <p className="mt-4 text-sm text-ink-muted">Loading…</p>
    </div>
  )
}
