import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CreateClinicStaffModal from '../../components/staff/CreateClinicStaffModal'
import { toastApiError } from '../../utils/formToast'

export default function ClinicStaffPage() {
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
      const res = await api.get('/clinic/staff')
      setItems(res.data?.items || [])
      setClinicName(res.data?.clinic?.name || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff')
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
      await api.delete(`/clinic/staff/${removeTarget._id}`)
      toast.success('Staff removed')
      setRemoveTarget(null)
      await load()
    } catch (err) {
      toastApiError(err, 'Could not remove staff')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Clinic staff</h1>
          <p className="mt-1 text-sm text-slate-500">
            People who can open the clinic portal for{clinicName ? ` ${clinicName}` : ' your clinic'}.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add staff
        </Button>
      </div>

      <CreateClinicStaffModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
      />

      <Modal
        open={Boolean(removeTarget)}
        onClose={busy ? undefined : () => setRemoveTarget(null)}
        title="Remove clinic access?"
        description="They will lose access to this clinic portal. Their patient account stays if they had one."
        centered
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{removeTarget?.name || 'Staff'}</p>
            <p className="mt-1 tabular-nums text-slate-600">{removeTarget?.phone}</p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={busy} onClick={confirmRemove}>
              Remove access
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
              No staff listed yet. Add someone who will help run the clinic.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {items.map((u) => (
                <li key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {u.name || 'No name'}
                      {u.isSelf ? <span className="ml-2 text-xs font-medium text-slate-500">(you)</span> : null}
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-slate-600">{u.phone || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {u.isWalletOwner ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
                        Wallet owner
                      </span>
                    ) : null}
                    {!u.isSelf && !u.isWalletOwner ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-xs text-rose-700"
                        onClick={() => setRemoveTarget(u)}
                      >
                        Remove
                      </Button>
                    ) : null}
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
