import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CreateClinicPhysioModal from '../../components/clinic/CreateClinicPhysioModal'
import { toastApiError } from '../../utils/formToast'

export default function ClinicPhysiosPage() {
  const [items, setItems] = useState([])
  const [clinicName, setClinicName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/clinic/physios')
      setItems(res.data?.physios || [])
      setClinicName(res.data?.clinic?.name || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load physiotherapists')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function confirmRemove() {
    if (!removeTarget?._id) return
    setBusy(true)
    try {
      await api.delete(`/clinic/physios/${removeTarget._id}`)
      toast.success('Removed from clinic roster')
      setRemoveTarget(null)
      await load()
    } catch (err) {
      toastApiError(err, 'Could not remove physiotherapist')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Clinic physiotherapists</h1>
          <p className="mt-1 text-sm text-slate-500">
            Physios on the roster for{clinicName ? ` ${clinicName}` : ' your clinic'}. Care managers
            can see they belong to this clinic when assigning cases.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add physio
        </Button>
      </div>

      <CreateClinicPhysioModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
      />

      <Modal
        open={Boolean(removeTarget)}
        onClose={busy ? undefined : () => setRemoveTarget(null)}
        title="Remove from clinic roster?"
        description="They keep their physio account, but will no longer be listed as part of this clinic."
        centered
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{removeTarget?.name || 'Physiotherapist'}</p>
            <p className="mt-1 tabular-nums text-slate-600">{removeTarget?.phone}</p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={busy} onClick={confirmRemove}>
              Remove from clinic
            </Button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <ListSkeleton count={4} />
      ) : (
        <>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {!items.length ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              No physiotherapists on your roster yet. Add someone who works at this clinic.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {items.map((p) => (
                <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{p.name || 'No name'}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {p.specialization || '—'}
                      <span className="text-slate-300"> · </span>
                      <span className="tabular-nums">{p.phone || '—'}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-900 ring-1 ring-teal-200">
                      {p.verificationStatus === 'approved' ? 'Approved' : p.verificationStatus || 'Pending'}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5 text-xs text-rose-700"
                      onClick={() => setRemoveTarget(p)}
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
