import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import VerificationBadge from '../../components/physio/VerificationBadge'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

function verificationLevelForBadge(level) {
  if (level === 'verified' || level === 'premium') return 'verified'
  return 'not_verified'
}

function DocLink({ label, url }) {
  if (!url) return <span className="text-ink-muted">{label}: —</span>
  const full = resolveFileUrl(url)
  const isImg = /\.(jpe?g|png|webp|gif)$/i.test(url.split('?')[0])
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {isImg ? (
        <a href={full} target="_blank" rel="noreferrer" className="block">
          <img src={full} alt={label} className="max-h-40 rounded-lg ring-1 ring-border-subtle" />
        </a>
      ) : (
        <a href={full} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand hover:underline">
          Open file
        </a>
      )}
    </div>
  )
}

export default function AdminPhysioDetailPage() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/physios/${id}`)
      setP(data)
    } catch (e) {
      toastApiError(e, 'Failed to load physiotherapist')
      setP(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function verify(status) {
    if (status === 'rejected') {
      const reason = rejectReason.trim()
      if (reason.length < 3) {
        toast.error('Please enter a rejection reason (at least 3 characters).')
        return
      }
    }
    setBusy(true)
    try {
      const body =
        status === 'rejected'
          ? { status: 'rejected', rejectionReason: rejectReason.trim() }
          : { status: 'verified' }
      await api.patch(`/admin/physios/${id}/verify`, body)
      toast.success(status === 'rejected' ? 'Application rejected' : 'Physiotherapist approved')
      setRejectReason('')
      await load()
    } catch (e) {
      toastApiError(e, 'Could not update verification status')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }
  if (!p) {
    return (
      <div>
        <p className="text-ink-muted">Physiotherapist not found.</p>
        <Link to="/admin/physios" className="mt-4 inline-block text-sm font-medium text-brand">
          ← Back to list
        </Link>
      </div>
    )
  }

  const v = p.verification || {}
  const q = p.qualification || {}
  const du = p.documentUrls || {}

  const verificationStatusLower = String(v.status || p.verificationStatus || '').toLowerCase()
  const platformAlreadyVerified =
    p.verificationStatus === 'approved' ||
    p.isVerified === true ||
    verificationStatusLower === 'verified'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/admin/physios" className="text-sm font-medium text-brand hover:underline">
            ← Physiotherapists
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{p.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{p.specialization}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">Platform verification</span>
            <VerificationBadge level={verificationLevelForBadge(v.level)} />
            <span className="text-xs text-ink-muted">Status: {v.status || p.verificationStatus}</span>
          </div>
        </div>
        {!platformAlreadyVerified ? (
          <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-white p-4 shadow-sm sm:min-w-[280px]">
            <p className="text-xs text-ink-muted">Approve marks the physiotherapist as verified on the platform.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => verify('verified')}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve (verified)
            </button>
            <textarea
              className="min-h-[72px] rounded-lg border border-border-subtle px-2 py-1.5 text-sm"
              placeholder="Rejection reason (required to reject)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={busy}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => verify('rejected')}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 sm:min-w-[280px]">
            <p className="font-medium">Verification complete</p>
            <p className="mt-1 text-xs text-emerald-900/90">
              This physiotherapist is already approved on the platform — no further approve/reject step is needed here.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="text-sm font-semibold text-ink">Basic</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Email</dt>
              <dd>{p.email || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Phone</dt>
              <dd>{p.phone || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">DOB</dt>
              <dd>{p.dob ? new Date(p.dob).toLocaleDateString() : '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Gender</dt>
              <dd>{p.gender || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Address</dt>
              <dd>{p.address || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Location / coverage</dt>
              <dd>{p.location || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="text-sm font-semibold text-ink">Qualification</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Degree</dt>
              <dd>{q.degree || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">University</dt>
              <dd>{q.university || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Passing Year</dt>
              <dd>{q.year ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Council reg. no.</dt>
              <dd>{q.registrationNumber || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle">
          <h2 className="text-sm font-semibold text-ink">Practice</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Experience</dt>
              <dd>{p.experience ?? 0} yrs</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Service type</dt>
              <dd>{p.serviceType || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-ink-muted">Areas</dt>
              <dd>{(p.serviceAreas || []).join(', ') || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Fee / session</dt>
              <dd>{`${formatPhysioSessionFeeLabel(p)}/session`}</dd>
            </div>
          </dl>
        </section>

        <section className="surface-card rounded-2xl p-6 ring-1 ring-border-subtle lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Documents</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DocLink label="Avatar" url={p.avatar} />
            <DocLink label="Qualification certificate" url={q.certificateUrl} />
            <DocLink label="ID proof" url={du.idProof} />
            <DocLink label="Registration certificate" url={du.registrationCertificate} />
            <DocLink label="Selfie with ID" url={du.selfieWithId} />
          </div>
          {(p.documents || []).length > 0 && (
            <div className="mt-6 border-t border-border-subtle pt-4">
              <h3 className="text-xs font-semibold uppercase text-ink-muted">Upload history</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {p.documents.map((d, i) => (
                  <li key={i}>
                    <span className="text-ink-muted">{d.type}</span>{' '}
                    <a href={resolveFileUrl(d.url)} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      view
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
