import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { validateFile } from '../../utils/onboardingValidation'

function looksLikePdf(path) {
  return /\.pdf(\?|#|$)/i.test(String(path || ''))
}

/**
 * Drag-and-drop file zone with thumbnail for images, PDF label, and optional preview for an already-saved server URL.
 */
export default function DocumentUploadPreview({
  label,
  description,
  required = true,
  file,
  serverUrl,
  onFileChange,
  error,
  inputId,
  accept = 'image/*,.pdf',
  showServerHint = true,
  children,
}) {
  const [objUrl, setObjUrl] = useState(null)
  const [serverThumbFailed, setServerThumbFailed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

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

  const hasFile = Boolean(file)
  const hasServer = Boolean(String(serverUrl || '').trim())
  const filled = hasFile || hasServer

  const pickFile = useCallback(
    (f) => {
      if (!f) {
        onFileChange(null)
        return
      }
      const r = validateFile(f, label || 'File')
      if (!r.ok) {
        toast.error(r.message)
        return
      }
      onFileChange(f)
    },
    [onFileChange, label],
  )

  const onInputChange = (e) => {
    pickFile(e.target.files?.[0] || null)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer?.files?.[0]
    if (dropped) pickFile(dropped)
  }

  const zoneRing = error
    ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
    : isDragging
      ? 'border-brand bg-brand/5 ring-2 ring-brand/25'
      : filled
        ? 'border-emerald-200/80 bg-emerald-50/30'
        : 'border-border-subtle bg-white hover:border-slate-300 hover:bg-slate-50/80'

  return (
    <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm ring-1 ring-black/2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold text-ink" htmlFor={inputId}>
              {label}
              {required ? (
                <span className="text-red-500" aria-hidden="true">
                  {' '}
                  *
                </span>
              ) : null}
            </label>
            {!required ? (
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200/80">
                Optional
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p> : null}
        </div>
        {filled ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Attached
          </span>
        ) : null}
      </div>

      {children ? <div className="mt-3">{children}</div> : null}

      {showServerHint && serverUrl && !file ? (
        <p className="mt-3 text-xs text-emerald-800">
          On file —{' '}
          <a href={resolvedServer} target="_blank" rel="noreferrer" className="font-medium underline">
            open
          </a>{' '}
          (replaced if you upload a new file)
        </p>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${zoneRing}`}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
        }}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onInputChange}
        />
        <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 16V4m0 0l4 4m-4-4L8 8" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-ink">
            {hasFile ? file.name : 'Drop a file here or browse'}
          </p>
          <p className="text-xs text-ink-muted">PDF, JPEG, PNG, or WebP · max 2MB</p>
          <span className="mt-1 inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/20">
            Choose file
          </span>
        </div>
      </div>

      {objUrl ? (
        <img
          src={objUrl}
          alt=""
          className="mt-3 h-28 max-w-full rounded-lg border border-border-subtle object-contain"
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
          className="mt-3 h-28 max-w-full rounded-lg border border-border-subtle object-contain"
          onError={() => setServerThumbFailed(true)}
        />
      ) : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
