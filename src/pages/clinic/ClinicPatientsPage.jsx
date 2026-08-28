import { useCallback, useEffect, useState } from 'react'
import { api } from '../../config/api'
import usePagination from '../../hooks/usePagination'
import Pagination from '../../components/Pagination'
import ListSkeleton from '../../components/ui/skeletons/ListSkeleton'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import CreatePatientModal from '../../components/staff/CreatePatientModal'

const SOURCE_TABS = [
  { id: 'added', label: 'Added by you' },
  { id: 'bookings', label: 'From bookings' },
  { id: 'all', label: 'All' },
]

export default function ClinicPatientsPage() {
  const { page, pageSize, applyMeta, clearMeta, paginationProps, resetPage } = usePagination()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [source, setSource] = useState('added')
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/clinic/patients', {
        params: {
          page,
          limit: pageSize,
          search: appliedSearch || undefined,
          source,
        },
      })
      setItems(res.data?.items || [])
      applyMeta(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients')
      setItems([])
      clearMeta()
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, appliedSearch, source, applyMeta, clearMeta])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Accounts you added for walk-ins, plus people who booked at your clinic.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add patient
        </Button>
      </div>

      <CreatePatientModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        apiPath="/clinic/patients"
        onCreated={() => {
          setSource('added')
          resetPage()
          load()
        }}
      />

      <div className="flex flex-wrap gap-2">
        {SOURCE_TABS.map((tab) => {
          const active = source === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSource(tab.id)
                resetPage()
              }}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
                active
                  ? 'bg-teal-700 text-white ring-teal-700'
                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          setAppliedSearch(search.trim())
          resetPage()
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone"
          className="sm:max-w-xs"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {!items.length ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              {source === 'added'
                ? 'No patients added yet. Tap Add patient to create a walk-in account — they will show up here.'
                : source === 'bookings'
                  ? 'No booking patients yet. They appear here after a clinic visit is assigned to you.'
                  : 'No patients linked to this clinic yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {items.map((u) => (
                <li key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{u.name || 'No name'}</p>
                    <p className="mt-0.5 text-sm tabular-nums text-slate-600">{u.phone || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {u.addedByClinic ? (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-800 ring-1 ring-teal-200">
                        Added by you
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                        From booking
                      </span>
                    )}
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200">
                      {u.bookingCount || 0} booking{(u.bookingCount || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination {...paginationProps} />
        </>
      )}
    </div>
  )
}
