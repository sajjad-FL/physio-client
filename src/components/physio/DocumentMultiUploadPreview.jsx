import { useCallback, useRef, useState } from 'react'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { validateFile } from '../../utils/onboardingValidation'

function looksLikePdf(path) {
  return /\.pdf(\?|#|$)/i.test(String(path || ''))
}

/**
 * Drag-and-drop zone for uploading multiple documents (e.g. internship certificates).
 */
export default function DocumentMultiUploadPreview({
  label,
  description,
  required = true,
  files = [],
  serverUrls = [],
  onFilesChange,
  error,
  inputId,
  accept = 'image/*,.pdf',
  maxFiles = 10,
  showServerHint = true,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [pickError, setPickError] = useState('')
  const inputRef = useRef(null)

  const pendingFiles = Array.isArray(files) ? files : []
  const savedUrls = (Array.isArray(serverUrls) ? serverUrls : []).filter((u) => String(u || '').trim())
  const totalCount = pendingFiles.length + savedUrls.length
  const filled = totalCount > 0
  const atMax = totalCount >= maxFiles

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming || [])
      if (!list.length) return

      const slotsLeft = maxFiles - totalCount
      if (slotsLeft <= 0) {
        setPickError(`You can upload up to ${maxFiles} files`)
        return
      }

      const next = [...pendingFiles]
      for (const file of list.slice(0, slotsLeft)) {
        const r = validateFile(file, label || 'File')
        if (!r.ok) {
          setPickError(r.message)
          return
        }
        next.push(file)
      }

      setPickError('')
      onFilesChange(next)
    },
    [label, maxFiles, onFilesChange, pendingFiles, totalCount],
  )

  const removePending = (index) => {
    setPickError('')
    onFilesChange(pendingFiles.filter((_, i) => i !== index))
  }

  const onInputChange = (e) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (atMax) return
    addFiles(e.dataTransfer?.files)
  }

  const displayError = error || pickError

  const zoneRing = displayError
    ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
    : isDragging
      ? 'border-brand bg-brand/5 ring-2 ring-brand/25'
      : filled
        ? 'border-emerald-200/80 bg-emerald-50/30'
        : 'border-border-subtle bg-white hover:border-slate-300 hover:bg-slate-50/80'

  return (
    <div className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm ring-1 ring-black/2 sm:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-semibold text-ink" htmlFor={inputId}>
              {label}
            </label>
            {required ? (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Required
              </span>
            ) : (
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200/80">
                Optional
              </span>
            )}
          </div>
          {description ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p> : null}
          <p className="mt-1 text-xs text-ink-muted">Up to {maxFiles} files · PDF, JPEG, PNG, or WebP · max 2MB each</p>
        </div>
        {filled ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            {totalCount} attached
          </span>
        ) : null}
      </div>

      {(savedUrls.length > 0 || pendingFiles.length > 0) && (
        <ul className="mt-4 space-y-2">
          {savedUrls.map((url, i) => {
            const resolved = resolveFileUrl(url)
            const isPdf = looksLikePdf(url)
            return (
              <li
                key={`saved-${url}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-canvas/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    Saved file {savedUrls.length > 1 ? i + 1 : ''}
                  </p>
                  {showServerHint ? (
                    <a
                      href={resolved}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand underline"
                    >
                      {isPdf ? 'Open PDF' : 'Open file'}
                    </a>
                  ) : null}
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                  Uploaded
                </span>
              </li>
            )
          })}
          {pendingFiles.map((file, i) => (
            <li
              key={`pending-${file.name}-${file.size}-${i}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-ink-muted">
                  {file.type === 'application/pdf' ? 'PDF' : 'Image'} · ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        role="button"
        tabIndex={atMax ? -1 : 0}
        aria-disabled={atMax}
        className={`mt-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${zoneRing} ${atMax ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!atMax) setIsDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!atMax) e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
        }}
        onDrop={onDrop}
        onKeyDown={(e) => {
          if (atMax) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => {
          if (!atMax) inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={onInputChange}
          disabled={atMax}
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
            {atMax ? 'Maximum files reached' : filled ? 'Add more files' : 'Drop files here or browse'}
          </p>
          {!atMax ? (
            <span className="mt-1 inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/20">
              Choose files
            </span>
          ) : null}
        </div>
      </div>

      {displayError ? <p className="mt-2 text-xs font-medium text-red-600">{displayError}</p> : null}
    </div>
  )
}
