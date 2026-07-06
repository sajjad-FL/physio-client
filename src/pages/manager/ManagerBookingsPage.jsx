import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import { formatBookingDateAndSlot } from '../../utils/date'
import Card from '../../components/ui/Card'

const WORKFLOW_LABELS = {
  manager_assigned: 'Visit pending',
  assessment_done: 'Create plan',
  awaiting_patient_consent: 'Awaiting consent',
  plan_live: 'Assign physio',
  physio_assigned: 'Collect payment',
  payment_recorded: 'In treatment',
  in_treatment: 'In treatment',
  pending_manager_assignment: 'Awaiting manager',
}

function nextActionLabel(b) {
  return WORKFLOW_LABELS[b.workflowStatus] || b.workflowStatus || 'Review'
}

export default function ManagerBookingsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/manager/bookings', { params: { limit: 50 } })
      setItems(res.data?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
  }

  if (!items.length) {
    return (
      <Card hover={false} className="p-8 text-center">
        <p className="text-slate-600">No assigned cases yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((b) => (
        <Link key={b._id} to={`/manager/bookings/${b._id}`} className="block">
          <Card className="p-4 transition hover:border-teal-200">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{b.userId?.name || 'Patient'}</p>
                <p className="mt-0.5 text-sm text-slate-600">{b.issue}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatBookingDateAndSlot(b.date, b.timeSlot)}
                  {b.pincode ? ` · ${b.pincode}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                {nextActionLabel(b)}
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
