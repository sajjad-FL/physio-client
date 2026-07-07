import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function AdminZonesPage() {
  const [zones, setZones] = useState([])
  const [managers, setManagers] = useState([])
  const [physios, setPhysios] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [pincodesRaw, setPincodesRaw] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [zRes, mRes, pRes] = await Promise.all([
        api.get('/admin/zones'),
        api.get('/admin/care-managers'),
        api.get('/physios', { params: { page: 1, limit: 100 } }),
      ])
      setZones(zRes.data?.zones || [])
      setManagers(mRes.data?.managers || [])
      setPhysios(pRes.data?.data || [])
    } catch {
      setZones([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createZone(e) {
    e.preventDefault()
    if (!name.trim()) return
    const pincodes = pincodesRaw
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p))
    setBusy(true)
    try {
      await api.post(
        '/admin/zones',
        { name: name.trim(), pincodes, managerIds: managers.map((m) => m._id).slice(0, 1), physioIds: [] },      )
      toast.success('Zone created')
      setName('')
      setPincodesRaw('')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create zone')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />

  return (
    <div className="space-y-6">
      <Card hover={false} className="p-5">
        <h2 className="font-semibold text-slate-900">Create service zone</h2>
        <form onSubmit={createZone} className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            placeholder="Zone name (e.g. Guwahati Central)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            rows={2}
            placeholder="Pincodes (comma or space separated, e.g. 781001 781002)"
            value={pincodesRaw}
            onChange={(e) => setPincodesRaw(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            Create zone
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {zones.map((z) => (
          <Card key={z._id} hover={false} className="p-4">
            <p className="font-semibold text-slate-900">{z.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              Pincodes: {(z.pincodes || []).join(', ') || '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Managers: {(z.managerIds || []).map((m) => m.name || m.phone).join(', ') || '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Physios: {(z.physioIds || []).length} linked
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
