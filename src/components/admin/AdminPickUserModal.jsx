import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveFileUrl } from '../../utils/serverOrigin'

function userAvatar(u) {
  return resolveFileUrl(u?.avatarUrl || u?.avatar)
}

export default function AdminPickUserModal({
  open,
  onClose,
  users,
  selectedId,
  onConfirmSelect,
  title = 'Choose a person',
  subtitle = 'Search registered users, then select who should get clinic access.',
  confirmLabel = 'Use this person',
}) {
  const [search, setSearch] = useState('')
  const [draftId, setDraftId] = useState(selectedId || '')

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setDraftId(selectedId || '')
      setSearch('')
    }
  }, [open, selectedId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = users || []
    if (!q) return list
    return list.filter((u) => {
      const blob = [u.name, u.phone, u.email, u.location, u.pincode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [users, search])

  const selectionId = useMemo(() => {
    if (!draftId) return ''
    return filtered.some((u) => String(u._id) === String(draftId)) ? draftId : ''
  }, [draftId, filtered])

  if (!open) return null

  function handleUseSelection() {
    if (!selectionId) return
    onConfirmSelect(selectionId)
    onClose()
  }

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pick-user-title"
    >
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 sm:max-h-[85vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="pick-user-title" className="text-base font-semibold text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            autoComplete="off"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          {(users || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
              No registered users found.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {search.trim() ? `No matches for “${search.trim()}”.` : 'No people to show.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((u) => {
                const id = u._id
                const active = String(selectionId) === String(id)
                const avatarSrc = userAvatar(u)
                return (
                  <li key={id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setDraftId(id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDraftId(id)
                        }
                      }}
                      className={[
                        'flex gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all sm:items-center',
                        active
                          ? 'border-teal-500 ring-2 ring-teal-500/30'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
                      ].join(' ')}
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                            {(u.name || u.phone || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{u.name || 'No name'}</p>
                        <p className="truncate text-[11px] text-slate-600">
                          {u.phone ? (
                            <span className="font-medium text-slate-700">{u.phone}</span>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                          {u.location ? (
                            <>
                              <span className="text-slate-300"> · </span>
                              <span className="text-slate-500">{u.location}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDraftId(id)
                        }}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        }`}
                      >
                        {active ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div
          className="shrink-0 border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:min-h-10"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectionId}
              onClick={handleUseSelection}
              className="min-h-11 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
