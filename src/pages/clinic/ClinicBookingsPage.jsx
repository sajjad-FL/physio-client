import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import usePagination from '../../hooks/usePagination'
import Pagination from '../../components/Pagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import { bookingCodeBadge } from '../../utils/bookingDisplay'

export default function ClinicBookingsPage() {
  const { page, pageSize, applyMeta, clearMeta, paginationProps } = usePagination()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/clinic/bookings', { params: { page, limit: pageSize } })
      setItems(res.data?.items || [])
      applyMeta(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cases')
      setItems([])
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <ListSkeleton count={6} />

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {!items.length ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No clinic cases yet. When a patient books clinic care (or a manager refers them here), the visit shows up
          in this list. Add walk-in patients under{' '}
          <Link to="/clinic/patients" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
            Patients
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((b) => {
            const patient = b.userId?.name || 'Patient'
            return (
              <li key={b._id}>
                <Link
                  to={`/clinic/bookings/${b._id}`}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{patient}</span>
                      {bookingCodeBadge(b)}
                      {b.clinicSource === 'manager_referred' ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                          Manager referred
                        </span>
                      ) : (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 ring-1 ring-teal-200">
                          Direct
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {b.issue || 'Clinic visit'} · {b.date} {b.timeSlot}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium capitalize text-slate-500">{b.status}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      <Pagination {...paginationProps} />
    </div>
  )
}
