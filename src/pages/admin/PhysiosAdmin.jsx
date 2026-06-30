import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { toastApiError, toastValidationErrors } from '../../utils/formToast'
import Pagination from '../../components/Pagination'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import VerificationsAdmin from './VerificationsAdmin'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

const TABS = [
  { id: 'directory', label: 'Directory & manage' },
  { id: 'queue', label: 'Verification queue' },
]

function verificationDisplayStatus(p) {
  return (
    p.displayVerificationStatus ||
    (p.verificationStatus === 'approved' ? 'verified' : p.verificationStatus || 'pending')
  )
}

function isPlatformVerified(p) {
  if (verificationDisplayStatus(p) === 'verified') return true
  if (p.isVerified === true) return true
  const raw = String(p.verification?.status || p.verificationStatus || '').toLowerCase()
  return raw === 'verified' || raw === 'approved'
}

export default function PhysiosAdmin() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'queue' ? 'queue' : 'directory'
  const [showAddForms, setShowAddForms] = useState(false)
  const [list, setList] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittingFromUser, setSubmittingFromUser] = useState(false)
  const [rowBusy, setRowBusy] = useState({})
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editSpec, setEditSpec] = useState('')
  const [editExp, setEditExp] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editAvail, setEditAvail] = useState(true)

  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [availability, setAvailability] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [fuSpec, setFuSpec] = useState('')
  const [fuName, setFuName] = useState('')
  const [fuLocation, setFuLocation] = useState('')
  const [fuLat, setFuLat] = useState('')
  const [fuLng, setFuLng] = useState('')
  const [fuAvailability, setFuAvailability] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const inputClass =
    'h-11 w-full rounded-lg border border-border-subtle bg-white px-3 text-sm text-ink shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

  const load = useCallback(async () => {
    setError('')
    try {
      const [pRes, uRes] = await Promise.all([
        api.get('/admin/physios', { params: { page, limit: 10 } }),
        api.get('/admin/users', { params: { withoutPhysio: true } }),
      ])
      setList(pRes.data?.data || [])
      setTotalPages(pRes.data?.totalPages || 1)
      setCandidates(uRes.data || [])
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load data'
      setError(msg)
      toastApiError(err, 'Failed to load physiotherapists')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedUserId) {
      setFuName('')
      setFuLocation('')
      return
    }
    const u = candidates.find((c) => c._id === selectedUserId)
    if (u) {
      setFuName(u.name || '')
      setFuLocation(u.location || '')
    }
  }, [selectedUserId, candidates])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !specialization.trim() || !location.trim()) {
      const msg = 'Name, specialization, and location are required.'
      setError(msg)
      toastValidationErrors({}, msg)
      return
    }
    setSubmitting(true)
    try {
      const body = {
        name: name.trim(),
        specialization: specialization.trim(),
        location: location.trim(),
        availability,
      }
      if (phone.trim()) body.phone = phone.trim()
      if (lat !== '' && lng !== '') {
        const la = Number(lat)
        const ln = Number(lng)
        if (!Number.isNaN(la) && !Number.isNaN(ln)) {
          body.lat = la
          body.lng = ln
        }
      }
      await api.post('/physios', body)
      toast.success('Physiotherapist added')
      setName('')
      setSpecialization('')
      setLocation('')
      setPhone('')
      setLat('')
      setLng('')
      setAvailability(true)
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not add physiotherapist'
      setError(msg)
      toastApiError(err, 'Could not add physiotherapist')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFromUser(e) {
    e.preventDefault()
    setError('')
    if (!selectedUserId) {
      const msg = 'Select a user account.'
      setError(msg)
      toastValidationErrors({}, msg)
      return
    }
    if (!fuSpec.trim()) {
      const msg = 'Specialization is required.'
      setError(msg)
      toastValidationErrors({}, msg)
      return
    }
    setSubmittingFromUser(true)
    try {
      const body = {
        userId: selectedUserId,
        specialization: fuSpec.trim(),
        availability: fuAvailability,
      }
      if (fuName.trim()) body.name = fuName.trim()
      if (fuLocation.trim()) body.location = fuLocation.trim()
      if (fuLat !== '' && fuLng !== '') {
        const la = Number(fuLat)
        const ln = Number(fuLng)
        if (!Number.isNaN(la) && !Number.isNaN(ln)) {
          body.lat = la
          body.lng = ln
        }
      }
      await api.post('/admin/physios/from-user', body)
      toast.success('Physiotherapist profile created and linked to user')
      setSelectedUserId('')
      setFuSpec('')
      setFuName('')
      setFuLocation('')
      setFuLat('')
      setFuLng('')
      setFuAvailability(true)
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not create from user'
      setError(msg)
      toastApiError(err, 'Could not create physiotherapist from user')
    } finally {
      setSubmittingFromUser(false)
    }
  }

  function openEditModal(physio) {
    setEditTarget(physio)
    setEditName(physio.name || '')
    setEditSpec(physio.specialization || '')
    setEditExp(String(physio.experience ?? 0))
    setEditPrice(String(physio.pricePerSession ?? 0))
    setEditAvail(Boolean(physio.isAvailable ?? physio.availability))
    setEditOpen(true)
  }

  function closeEditModal() {
    setEditOpen(false)
    setEditTarget(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editTarget?._id) return
    if (!editName.trim() || !editSpec.trim()) {
      const msg = 'Name and specialization are required.'
      setError(msg)
      toastValidationErrors({}, msg)
      return
    }
    const expNum = Number(editExp)
    const priceNum = Number(editPrice)
    if (!Number.isFinite(expNum) || expNum < 0) {
      toastValidationErrors({}, 'Experience must be a valid non-negative number')
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toastValidationErrors({}, 'Fee per session must be a valid non-negative number')
      return
    }
    setError('')
    setRowBusy((b) => ({ ...b, [editTarget._id]: 'edit' }))
    try {
      await api.patch(`/admin/physios/${editTarget._id}`, {
        name: editName.trim(),
        specialization: editSpec.trim(),
        experience: Number(editExp),
        pricePerSession: Number(editPrice),
        isAvailable: editAvail,
      })
      toast.success('Physiotherapist updated')
      closeEditModal()
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not update physiotherapist'
      setError(msg)
      toastApiError(err, 'Update failed')
    } finally {
      setRowBusy((b) => {
        const n = { ...b }
        delete n[editTarget._id]
        return n
      })
    }
  }

  function verificationLevelLabel(level) {
    if (level === 'verified' || level === 'premium') return 'verified'
    if (level === 'not_verified' || level === 'basic') return 'not_verified'
    return level || '—'
  }

  async function verifyPhysio(id, status, extra = {}) {
    setError('')
    setRowBusy((b) => ({ ...b, [id]: status }))
    try {
      await api.patch(`/admin/physios/${id}/verify`, { status, ...extra })
      const ok = status === 'verified' || status === 'approved'
      toast.success(ok ? 'Physiotherapist approved' : 'Physiotherapist rejected')
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification update failed'
      setError(msg)
      toastApiError(err, 'Verification update failed')
    } finally {
      setRowBusy((b) => {
        const n = { ...b }
        delete n[id]
        return n
      })
    }
  }

  async function deletePhysio(id, nameLabel) {
    const ok = window.confirm(`Are you sure you want to delete this physiotherapist?\n\n${nameLabel || ''}`)
    if (!ok) return
    setError('')
    setRowBusy((b) => ({ ...b, [id]: 'delete' }))
    try {
      await api.delete(`/admin/physios/${id}`)
      toast.success('Physiotherapist deleted')
      await load()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Delete failed'
      setError(msg)
      toastApiError(err, 'Delete failed')
    } finally {
      setRowBusy((b) => {
        const n = { ...b }
        delete n[id]
        return n
      })
    }
  }

  function setTab(tab) {
    setSearchParams(tab === 'queue' ? { tab: 'queue' } : {})
  }

  if (loading && activeTab === 'directory') {
    return (
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-brand" aria-hidden />
        <p className="text-sm font-medium text-ink-muted" role="status">
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div>
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-border-subtle">
            <h3 className="type-page-title text-ink">Edit physiotherapist</h3>
            <form onSubmit={saveEdit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-2 block text-sm font-medium text-ink">
                  Name
                </label>
                <input
                  id="edit-name"
                  className={inputClass}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-spec" className="mb-2 block text-sm font-medium text-ink">
                  Specialization
                </label>
                <input
                  id="edit-spec"
                  className={inputClass}
                  value={editSpec}
                  onChange={(e) => setEditSpec(e.target.value)}
                  placeholder="e.g. Orthopedic, Neuro rehab"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-exp" className="mb-2 block text-sm font-medium text-ink">
                    Experience (years)
                  </label>
                  <input
                    id="edit-exp"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                    placeholder="Years of experience"
                  />
                </div>
                <div>
                  <label htmlFor="edit-price" className="mb-2 block text-sm font-medium text-ink">
                    Fee per session (₹)
                  </label>
                  <input
                    id="edit-price"
                    type="number"
                    min="0"
                    className={inputClass}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input type="checkbox" checked={editAvail} onChange={(e) => setEditAvail(e.target.checked)} />
                Available for new bookings
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEditModal} className="cursor-pointer rounded-lg border border-border-subtle px-4 py-2 text-sm shadow-sm transition duration-200 ease-in-out hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-200 ease-in-out hover:bg-blue-600">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminPageHeader
        title="Physiotherapists"
        subtitle="Manage the physiotherapist directory, approve new applications, and create profiles."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Physiotherapists' }]}
        actions={
          activeTab === 'directory' ? (
            <button
              type="button"
              onClick={() => setShowAddForms((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              {showAddForms ? 'Hide add forms' : 'Add physiotherapist'}
            </button>
          ) : (
            <Link to="/admin/users" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
              Browse users →
            </Link>
          )
        }
      />

      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'queue' ? (
        <VerificationsAdmin embedded />
      ) : (
        <>
      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </div>
      )}

      {showAddForms && (
      <>
      <form
        onSubmit={handleFromUser}
        className="mb-10 rounded-2xl border border-border-subtle bg-white p-6 shadow-[0_2px_8px_rgba(10,37,64,0.04)] sm:p-8"
      >
        <h2 className="type-page-title text-ink">Add from patient account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pick an existing user (no physiotherapist profile yet). Their phone is used for OTP login. Add specialization and
          optional overrides.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fu-user" className="mb-2 block text-sm font-medium text-ink">
              User
            </label>
            <select
              id="fu-user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={inputClass}
              disabled={submittingFromUser}
            >
              <option value="">— Select user —</option>
              {candidates.map((u) => (
                <option key={u._id} value={u._id}>
                  {(u.name || 'No name') + ' · ' + u.phone}
                  {u.location ? ` · ${u.location}` : ''}
                </option>
              ))}
            </select>
            {candidates.length === 0 && (
              <p className="mt-2 text-xs text-ink-muted">No users without a physiotherapist link, or list is empty.</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fu-spec" className="mb-2 block text-sm font-medium text-ink">
              Specialization <span className="text-red-600">*</span>
            </label>
            <input
              id="fu-spec"
              value={fuSpec}
              onChange={(e) => setFuSpec(e.target.value)}
              className={inputClass}
              required
              disabled={submittingFromUser}
              placeholder="e.g. Orthopedic, Sports"
            />
          </div>
          <div>
            <label htmlFor="fu-name" className="mb-2 block text-sm font-medium text-ink">
              Name override
            </label>
            <input
              id="fu-name"
              value={fuName}
              onChange={(e) => setFuName(e.target.value)}
              className={inputClass}
              disabled={submittingFromUser}
              placeholder="Defaults from user"
            />
          </div>
          <div>
            <label htmlFor="fu-loc" className="mb-2 block text-sm font-medium text-ink">
              Location / coverage <span className="text-red-600">*</span>
            </label>
            <input
              id="fu-loc"
              value={fuLocation}
              onChange={(e) => setFuLocation(e.target.value)}
              className={inputClass}
              disabled={submittingFromUser}
              placeholder="Required if missing on user"
            />
          </div>
          <div>
            <label htmlFor="fu-lat" className="mb-2 block text-sm font-medium text-ink">
              Latitude (optional)
            </label>
            <input
              id="fu-lat"
              value={fuLat}
              onChange={(e) => setFuLat(e.target.value)}
              className={inputClass}
              disabled={submittingFromUser}
            />
          </div>
          <div>
            <label htmlFor="fu-lng" className="mb-2 block text-sm font-medium text-ink">
              Longitude (optional)
            </label>
            <input
              id="fu-lng"
              value={fuLng}
              onChange={(e) => setFuLng(e.target.value)}
              className={inputClass}
              disabled={submittingFromUser}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="fu-avail"
              type="checkbox"
              checked={fuAvailability}
              onChange={(e) => setFuAvailability(e.target.checked)}
              disabled={submittingFromUser}
              className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand/30"
            />
            <label htmlFor="fu-avail" className="text-sm text-ink-muted">
              Available for new bookings
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={submittingFromUser || !selectedUserId}
          className="mt-6 flex h-11 cursor-pointer items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-sm transition duration-200 ease-in-out hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingFromUser ? 'Creating…' : 'Create physiotherapist profile & link user'}
        </button>
      </form>

      <form
        onSubmit={handleSubmit}
        className="mb-10 rounded-2xl border border-border-subtle bg-white p-6 shadow-[0_2px_8px_rgba(10,37,64,0.04)] sm:p-8"
      >
        <h2 className="type-page-title text-ink">Add manually</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Create a physiotherapist record without linking a user (link on first OTP if phone matches).
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="p-name" className="mb-2 block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="p-spec" className="mb-2 block text-sm font-medium text-ink">
              Specialization
            </label>
            <input
              id="p-spec"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className={inputClass}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="p-phone" className="mb-2 block text-sm font-medium text-ink">
              Phone (OTP login)
            </label>
            <input
              id="p-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="10-digit, same as physiotherapist app login"
              disabled={submitting}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-loc" className="mb-2 block text-sm font-medium text-ink">
              Location / coverage area
            </label>
            <input
              id="p-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="p-lat" className="mb-2 block text-sm font-medium text-ink">
              Latitude (optional)
            </label>
            <input
              id="p-lat"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="p-lng" className="mb-2 block text-sm font-medium text-ink">
              Longitude (optional)
            </label>
            <input
              id="p-lng"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={inputClass}
              disabled={submitting}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="p-avail"
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand/30"
            />
            <label htmlFor="p-avail" className="text-sm text-ink-muted">
              Available for new bookings
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex h-11 cursor-pointer items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-sm transition duration-200 ease-in-out hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Add physiotherapist'}
        </button>
      </form>
      </>
      )}

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-border-subtle bg-canvas/80 px-4 py-3.5 sm:px-6">
          <h2 className="text-sm font-semibold text-ink">Directory</h2>
          <p className="mt-0.5 text-xs text-ink-muted">All registered physiotherapists</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-canvas/80 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Experience</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Availability</th>
                <th className="px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {list.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-ink-muted" colSpan={7}>
                    No physiotherapists yet.
                  </td>
                </tr>
              ) : (
                list.map((p) => {
                  const busy = rowBusy[p._id]
                  const availabilityNow = p.isAvailable ?? p.availability
                  const disp = verificationDisplayStatus(p)
                  const alreadyVerified = isPlatformVerified(p)
                  const isRejected = disp === 'rejected'
                  return (
                    <tr key={p._id} className="transition duration-200 ease-in-out hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{p.specialization}</p>
                        <Link
                          to={`/admin/physios/${p._id}`}
                          className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                        >
                          View details
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-ink-muted">{p.experience ?? 0} years</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          disp === 'verified'
                            ? 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
                            : disp === 'rejected'
                              ? 'bg-rose-50 text-rose-900 ring-rose-200/80'
                              : 'bg-amber-50 text-amber-900 ring-amber-200/80'
                        }`}>
                          {disp}
                        </span>
                        {p.verification?.level ? (
                          <span className="mt-1 block text-[10px] text-ink-muted">Tier: {p.verification.level}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-ink-muted">{formatPhysioSessionFeeLabel(p)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          availabilityNow
                            ? 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
                            : 'bg-canvas text-ink-muted ring-border-subtle'
                        }`}>
                          {availabilityNow ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            disabled={Boolean(busy)}
                            className="cursor-pointer rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Edit
                          </button>
                          {!alreadyVerified ? (
                            <button
                              type="button"
                              onClick={() => verifyPhysio(p._id, 'verified')}
                              disabled={Boolean(busy)}
                              className="cursor-pointer rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy === 'verified' ? '…' : 'Approve'}
                            </button>
                          ) : null}
                          {!alreadyVerified && !isRejected ? (
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt('Rejection reason (required, min 3 characters):') || ''
                                if (reason.trim().length < 3) {
                                  toast.error('Enter a rejection reason of at least 3 characters, or cancel.')
                                  return
                                }
                                verifyPhysio(p._id, 'rejected', { rejectionReason: reason.trim() })
                              }}
                              disabled={Boolean(busy)}
                              className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy === 'rejected' ? '…' : 'Reject'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => deletePhysio(p._id, p.name)}
                            disabled={Boolean(busy)}
                            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition duration-200 ease-in-out hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busy === 'delete' ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
