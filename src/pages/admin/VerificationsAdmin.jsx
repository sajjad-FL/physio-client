import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'

export default function VerificationsAdmin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

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
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Verification queue</h1>
      <p className="mt-2 text-sm text-ink-muted">Approve or reject physiotherapist applications.</p>

      <div className="surface-card mt-8 overflow-hidden rounded-2xl">
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === p._id}
                        onClick={() => patch(p._id, 'approved')}
                        className="cursor-pointer rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition duration-200 ease-in-out hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === p._id}
                        onClick={() => patch(p._id, 'rejected')}
                        className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition duration-200 ease-in-out hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
