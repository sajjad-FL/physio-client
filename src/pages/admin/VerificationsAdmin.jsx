import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

function DocLink({ label, url }) {
  if (!url) return <span className="text-ink-muted">{label}: —</span>
  const full = resolveFileUrl(url)
  const base = url.split('?')[0]
  const isImg = /\.(jpe?g|png|webp|gif)$/i.test(base)
  const isPdf = /\.pdf$/i.test(base)
  return (
    <div className="space-y-1 rounded-lg border border-border-subtle bg-canvas/50 p-3">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {isImg ? (
        <a href={full} target="_blank" rel="noreferrer" className="block">
          <img src={full} alt={label} className="max-h-44 rounded-md ring-1 ring-border-subtle" />
        </a>
      ) : (
        <a
          href={full}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-brand hover:underline"
        >
          {isPdf ? 'Open PDF' : 'Open file'}
        </a>
      )}
    </div>
  )
}

function DetailGrid({ p }) {
  const q = p.qualification || {}
  const du = p.documentUrls || {}
  const coords = p.coordinates

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Profile</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Email" value={p.email} />
          <Row label="Phone" value={p.phone} />
          <Row label="DOB" value={p.dob ? new Date(p.dob).toLocaleDateString() : null} />
          <Row label="Gender" value={p.gender} />
          <Row label="Address" value={p.address} multiline />
          <Row label="Location / coverage" value={p.location} multiline />
          {coords?.lat != null && coords?.lng != null ? (
            <Row label="Coordinates" value={`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`} />
          ) : null}
        </dl>
      </section>

      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Qualification</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Degree" value={q.degree} />
          <Row label="University" value={q.university} />
          <Row label="Passing Year" value={q.year != null ? String(q.year) : null} />
          <Row label="Council reg. no." value={q.registrationNumber} />
        </dl>
      </section>

      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Practice</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Specialization" value={p.specialization} />
          <Row label="Experience" value={p.experience != null ? `${p.experience} yrs` : null} />
          <Row label="Service type" value={p.serviceType} />
          <Row
            label="Service areas"
            value={(p.serviceAreas || []).filter(Boolean).join(', ') || null}
            multiline
          />
          <Row
            label="Fee / session"
            value={p.pricePerSession != null ? `${formatPhysioSessionFeeLabel(p)}/session` : null}
          />
        </dl>
      </section>

      <section className="rounded-xl border border-border-subtle bg-white p-4 shadow-sm sm:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Submitted documents</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Open each file in a new tab. Images preview below; PDFs use the link.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DocLink label="Profile photo" url={p.avatar} />
          <DocLink label="Qualification certificate" url={q.certificateUrl} />
          <DocLink label="ID proof" url={du.idProof} />
          <DocLink label="Registration certificate" url={du.registrationCertificate} />
          <DocLink label="Selfie with ID" url={du.selfieWithId} />
        </div>
        {(p.documents || []).length > 0 ? (
          <div className="mt-5 border-t border-border-subtle pt-4">
            <h4 className="text-xs font-semibold uppercase text-ink-muted">Upload log</h4>
            <ul className="mt-2 space-y-2 text-sm">
              {(p.documents || []).map((d, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-xs text-ink-muted">{d.type}</span>
                  <a
                    href={resolveFileUrl(d.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    View file
                  </a>
                  {d.uploadedAt ? (
                    <span className="text-xs text-ink-muted">
                      {new Date(d.uploadedAt).toLocaleString()}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Row({ label, value, multiline }) {
  const v = value != null && String(value).trim() !== '' ? value : null
  return (
    <div className={multiline ? 'flex flex-col gap-0.5' : 'flex justify-between gap-3'}>
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className={`text-right font-medium text-ink ${multiline ? 'text-left' : ''}`}>{v ?? '—'}</dd>
    </div>
  )
}

export default function VerificationsAdmin({ embedded = false }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [viewing, setViewing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/physio-verifications')
      setList(res.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function patch(id, verificationStatus) {
    setBusy(id)
    try {
      await api.patch(`/admin/physio-verifications/${id}`, { verificationStatus })
      toast.success(verificationStatus === 'approved' ? 'Approved' : 'Rejected')
      setViewing((v) => (v && v._id === id ? null : v))
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  return (
    <div>
      {!embedded && (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">Verification queue</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review new physio applications with submitted documents. Approved physios can accept bookings.
          </p>
        </>
      )}

      <div className={`surface-card overflow-hidden rounded-2xl ${embedded ? '' : 'mt-8'}`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-subtle bg-canvas/80 text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No pending verifications.
                </td>
              </tr>
            ) : (
              list.map((p) => (
                <tr key={p._id} className="transition duration-200 ease-in-out hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.phone || '—'}</td>
                  <td className="px-4 py-3">{p.verificationStatus}</td>
                  <td className="px-4 py-3 text-ink-muted">{(p.documents || []).length} file(s)</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        className="cursor-pointer rounded-lg border border-border-subtle bg-white px-3 py-2 text-xs font-medium text-ink shadow-sm transition hover:bg-canvas"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        disabled={busy === p._id}
                        onClick={() => patch(p._id, 'approved')}
                        className="cursor-pointer rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === p._id}
                        onClick={() => patch(p._id, 'rejected')}
                        className="cursor-pointer rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <Link
                        to={`/admin/physios/${p._id}`}
                        className="inline-flex items-center rounded-lg border border-brand/30 px-3 py-2 text-xs font-medium text-brand hover:bg-brand/5"
                      >
                        Full page
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-detail-title"
          onClick={() => setViewing(null)}
        >
          <div
            className="flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div>
                <h2 id="verification-detail-title" className="text-lg font-semibold text-ink">
                  {viewing.name}
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {viewing.specialization || '—'} · Status: {viewing.verificationStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <DetailGrid p={viewing} />
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-canvas/40 px-5 py-4">
              <Link
                to={`/admin/physios/${viewing._id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Open full physio page (tier &amp; rejection reason) →
              </Link>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === viewing._id}
                  onClick={() => patch(viewing._id, 'approved')}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === viewing._id}
                  onClick={() => patch(viewing._id, 'rejected')}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
