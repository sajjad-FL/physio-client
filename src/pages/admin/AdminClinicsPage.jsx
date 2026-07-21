import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import FieldLabel from '../../components/ui/FieldLabel'
import LocationAutocomplete from '../../components/booking/LocationAutocomplete'
import AdminPickUserModal from '../../components/admin/AdminPickUserModal'
import { resolveFileUrl } from '../../utils/serverOrigin'

function formatInr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function extractPincode(text) {
  const m = String(text || '').match(/\b(\d{6})\b/)
  return m ? m[1] : null
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [coords, setCoords] = useState(null)
  const [promoteUserId, setPromoteUserId] = useState('')
  const [promoteClinicId, setPromoteClinicId] = useState('')
  const [pickUserOpen, setPickUserOpen] = useState(false)
  const [selectedClinicId, setSelectedClinicId] = useState('')
  const [ledger, setLedger] = useState(null)
  const [busy, setBusy] = useState(false)

  const selectedPerson = useMemo(
    () => users.find((u) => String(u._id) === String(promoteUserId)) || null,
    [users, promoteUserId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, u] = await Promise.all([
        api.get('/admin/clinics'),
        api.get('/admin/users', { params: { page: 1, limit: 100, role: 'user' } }),
      ])
      setClinics(c.data?.clinics || [])
      const rawUsers = u.data?.users || u.data?.items || u.data?.data || []
      setUsers(Array.isArray(rawUsers) ? rawUsers : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load clinics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createClinic() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!address.trim()) {
      toast.error('Address is required')
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        pincode: extractPincode(address),
      }
      if (coords?.lat != null && coords?.lng != null) {
        payload.coordinates = { lat: coords.lat, lng: coords.lng }
      }
      await api.post('/admin/clinics', payload)
      toast.success('Clinic created')
      setName('')
      setAddress('')
      setPhone('')
      setCoords(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function promote() {
    if (!promoteUserId || !promoteClinicId) {
      toast.error('Choose a person and a clinic')
      return
    }
    setBusy(true)
    try {
      await api.post('/admin/clinic-staff/promote', {
        userId: promoteUserId,
        clinicId: promoteClinicId,
      })
      toast.success('This person can now manage the clinic')
      setPromoteUserId('')
      setPromoteClinicId('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add clinic access')
    } finally {
      setBusy(false)
    }
  }

  async function loadLedger(clinicId) {
    setSelectedClinicId(clinicId)
    try {
      const res = await api.get(`/admin/clinics/${clinicId}/ledger`)
      setLedger(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ledger')
    }
  }

  async function createBatch() {
    if (!selectedClinicId) return
    setBusy(true)
    try {
      await api.post(`/admin/clinics/${selectedClinicId}/settlement-batches`, {})
      toast.success('Settlement batch created')
      loadLedger(selectedClinicId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch failed')
    } finally {
      setBusy(false)
    }
  }

  async function settleBatch(batchId) {
    setBusy(true)
    try {
      await api.patch(`/admin/clinic-settlement-batches/${batchId}/settle`)
      toast.success('Batch settled')
      if (selectedClinicId) loadLedger(selectedClinicId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settle failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ListSkeleton count={6} />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Clinics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add clinic locations, give people access to run them, and settle cash collected there.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Add a new clinic</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="clinic-name" required>
              Clinic name
            </FieldLabel>
            <input
              id="clinic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kokrajhar Clinic"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div className="min-w-0">
            <FieldLabel htmlFor="clinic-address" required>
              Address
            </FieldLabel>
            <LocationAutocomplete
              id="clinic-address"
              value={address}
              onChange={setAddress}
              onPlaceResolved={(place) => {
                if (place) {
                  setCoords({ lat: place.lat, lng: place.lng })
                  setAddress(place.label)
                } else {
                  setCoords(null)
                }
              }}
              placeholder="Type to search address (Mapbox)"
            />
          </div>
          <div>
            <FieldLabel htmlFor="clinic-phone">Phone</FieldLabel>
            <input
              id="clinic-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Clinic contact number"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={createClinic}
          className="mt-4 h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          Create
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Give someone clinic access</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose a person already registered in the app, then choose which clinic they will manage.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end">
          <div>
            <FieldLabel required>Person</FieldLabel>
            {selectedPerson ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {resolveFileUrl(selectedPerson.avatarUrl || selectedPerson.avatar) ? (
                    <img
                      src={resolveFileUrl(selectedPerson.avatarUrl || selectedPerson.avatar)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                      {(selectedPerson.name || selectedPerson.phone || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{selectedPerson.name || 'No name'}</p>
                  <p className="truncate text-xs text-slate-500">{selectedPerson.phone || 'No phone'}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPickUserOpen(true)}
                  className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => setPickUserOpen(true)}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-left text-sm font-medium hover:border-teal-300 hover:bg-teal-50/40 disabled:opacity-60"
              >
                <span className="block text-slate-900">Choose a person…</span>
                <span className="mt-0.5 block text-xs font-normal text-slate-500">
                  Browse name, phone &amp; profile photo
                </span>
              </button>
            )}
            <AdminPickUserModal
              open={pickUserOpen}
              onClose={() => setPickUserOpen(false)}
              users={users}
              selectedId={promoteUserId}
              onConfirmSelect={(userId) => setPromoteUserId(userId)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="clinic-staff-clinic" required>
              Their clinic
            </FieldLabel>
            <select
              id="clinic-staff-clinic"
              value={promoteClinicId}
              onChange={(e) => setPromoteClinicId(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">Choose a clinic</option>
              {clinics.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={promote}
            className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Give access
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Your clinics</h2>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {clinics.map((c) => (
            <li key={c._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.address || 'No address'} · {(c.staffUserIds || []).length} staff ·{' '}
                  {c.isActive ? 'Open' : 'Closed'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadLedger(c._id)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cash & settle
              </button>
            </li>
          ))}
          {!clinics.length ? (
            <li className="px-4 py-10 text-center text-sm text-slate-500">No clinics yet</li>
          ) : null}
        </ul>
      </section>

      {ledger && selectedClinicId ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{ledger.clinic?.name} ledger</h2>
            <button
              type="button"
              disabled={busy}
              onClick={createBatch}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Batch open entries
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Open cash {formatInr(ledger.openTotal)} · Pending clinic cut{' '}
            {formatInr(ledger.pendingPreview?.clinicTotal)} · Manager cut{' '}
            {formatInr(ledger.pendingPreview?.managerTotal)} · Settled{' '}
            {formatInr(ledger.settledCommission)}
          </p>
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {(ledger.entries || []).map((e) => (
              <li key={e._id} className="flex justify-between px-3 py-2 text-sm">
                <span>
                  {formatInr(e.amount)} · {e.status}
                </span>
                <span className="text-xs text-slate-500">
                  Clinic {formatInr(e.clinicCommissionAmount)}
                  {e.managerCommissionAmount ? ` · Mgr ${formatInr(e.managerCommissionAmount)}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-2">
            {(ledger.batches || []).map((batch) => (
              <li
                key={batch._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm"
              >
                <span>
                  Batch {formatInr(batch.expectedAmount)} · {batch.status}
                  {batch.distributionPreview
                    ? ` · Preview clinic ${formatInr(batch.distributionPreview.clinicTotal)} / mgr ${formatInr(batch.distributionPreview.managerTotal)}`
                    : ''}
                </span>
                {batch.status === 'open' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => settleBatch(batch._id)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Settle
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
