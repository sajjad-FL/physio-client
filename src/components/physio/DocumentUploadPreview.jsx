import { useEffect, useState } from 'react'
import { resolveFileUrl } from '../../utils/serverOrigin'

function looksLikePdf(path) {
  return /\.pdf(\?|#|$)/i.test(String(path || ''))
}

/**
 * File picker with thumbnail for images, PDF label, and optional preview for an already-saved server URL.
 */
export default function DocumentUploadPreview({
  label,
  file,
  serverUrl,
  onFileChange,
  error,
  inputId,
  accept = 'image/*,.pdf',
  showServerHint = true,
}) {
  const [objUrl, setObjUrl] = useState(null)
  const [serverThumbFailed, setServerThumbFailed] = useState(false)

  useEffect(() => {
    setServerThumbFailed(false)
  }, [serverUrl])

  useEffect(() => {
    if (!file || !/^image\//.test(file.type)) {
      setObjUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return undefined
    }
    const u = URL.createObjectURL(file)
    setObjUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const resolvedServer = serverUrl ? resolveFileUrl(serverUrl) : ''
  const showServerAsPdf = Boolean(!file && serverUrl && (looksLikePdf(serverUrl) || serverThumbFailed))
  const showServerAsImg = Boolean(!file && serverUrl && !looksLikePdf(serverUrl) && !serverThumbFailed)

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-muted" htmlFor={inputId}>
        {label}
      </label>
      {showServerHint && serverUrl && !file ? (
        <p className="mb-1 text-xs text-emerald-700">
          On file —{' '}
          <a href={resolvedServer} target="_blank" rel="noreferrer" className="font-medium underline">
            open
          </a>{' '}
          (replaced if you pick a new file)
        </p>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className={error ? 'rounded border border-red-300 p-1' : ''}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
      {objUrl ? (
        <img
          src={objUrl}
          alt=""
          className="mt-2 h-28 max-w-full rounded-lg border border-border-subtle object-contain"
        />
      ) : null}
      {file && file.type === 'application/pdf' ? (
        <p className="mt-2 text-xs text-ink-muted">Selected PDF: {file.name}</p>
      ) : null}
      {!file && serverUrl && showServerAsPdf ? (
        <p className="mt-2 text-xs text-ink-muted">
          <a href={resolvedServer} target="_blank" rel="noreferrer" className="font-medium text-brand underline">
            View uploaded PDF
          </a>
        </p>
      ) : null}
      {!file && serverUrl && showServerAsImg ? (
        <img
          src={resolvedServer}
          alt=""
          className="mt-2 h-28 max-w-full rounded-lg border border-border-subtle object-contain"
          onError={() => setServerThumbFailed(true)}
        />
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
