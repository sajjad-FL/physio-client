import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../config/api'
import DetailSkeleton from '../../components/ui/skeletons/DetailSkeleton'
import Button from '../../components/ui/Button'
import { assetUrl } from '../../utils/assetUrl'
import {
  bookingCodeBadge,
  formatBookingVisitWithCondition,
  formatPaidAt,
  marketplacePaymentStatusLabel,
  paymentAmountLabel,
  paymentModeLabel,
  paymentStatusLabel,
  serviceTypeLabel,
} from '../../utils/bookingDisplay'

const STATUS_CHIP = {
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  paid: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  collected: 'bg-amber-50 text-amber-900 ring-amber-200',
  verified: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-900 ring-rose-200',
  refunded: 'bg-slate-100 text-slate-700 ring-slate-200',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const STATUS_LABEL = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  collected: 'Collected — pending verification',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

function formatRupees(n) {
  const v = Number(n || 0)
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function installmentModeLabel(p) {
  const channel = String(p?.meta?.collectionChannel || '').toLowerCase()
  if (channel === 'phonepe_qr') return 'PhonePe QR'
  if (channel === 'cash') return 'Cash'
  if (p?.mode === 'online') return 'Online (Razorpay)'
  if (p?.mode === 'offline') return 'Cash / UPI'
  return p?.mode || '—'
}

function Row({ label, value, last }) {
  return (
    <div className={`flex justify-between gap-4 py-3 ${last ? '' : 'border-b border-slate-100'}`}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

/**
 * Dedicated payment details / receipt page for a patient booking.
 * Optional ?paymentId= highlights a specific installment.
 */
export default function PaymentDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const paymentId = searchParams.get('paymentId') || ''
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/bookings/${id}`)
      setBooking(res.data)
    } catch (e) {
      setError(e.response?.status === 404 ? 'Booking not found' : e.response?.data?.message || 'Failed to load')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const payments = useMemo(() => {
    const list = Array.isArray(booking?.payments) ? [...booking.payments] : []
    return list.sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
  }, [booking])

  const selectedPayment = useMemo(() => {
    if (!paymentId) return null
    return payments.find((p) => String(p._id) === String(paymentId)) || null
  }, [payments, paymentId])

  const summary = booking?.paymentSummary || {}
  const totalAmount = Number(summary.totalAmount || booking?.totalAmount || 0)
  const totalPaid = Number(summary.totalPaid || booking?.totalPaid || 0)
  const outstanding = Number.isFinite(Number(summary.outstanding))
    ? Number(summary.outstanding)
    : Math.max(0, totalAmount - totalPaid)

  if (loading) return <DetailSkeleton />

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{error || 'Unable to load payment details.'}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/bookings')}>
          Back to bookings
        </Button>
      </div>
    )
  }

  const b = booking
  const bookingRef = bookingCodeBadge(b)
  const proofSrc = selectedPayment?.proofUrl ? assetUrl(selectedPayment.proofUrl) : ''

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <Link
        to={`/dashboard/bookings/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        ← Back to session
      </Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment details</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {selectedPayment ? formatRupees(selectedPayment.amount) : formatRupees(totalAmount || booking.totalAmount)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatBookingVisitWithCondition(b)}
          {bookingRef ? ` · ${bookingRef}` : ''}
        </p>
      </header>

      {selectedPayment ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">This payment</h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                STATUS_CHIP[selectedPayment.status] || STATUS_CHIP.pending
              }`}
            >
              {STATUS_LABEL[selectedPayment.status] || selectedPayment.status}
            </span>
          </div>
          <dl className="mt-2">
            <Row label="Amount" value={formatRupees(selectedPayment.amount)} />
            <Row label="Mode" value={installmentModeLabel(selectedPayment)} />
            <Row
              label="Recorded"
              value={formatDateTime(
                selectedPayment.verifiedAt || selectedPayment.collectedAt || selectedPayment.createdAt,
              )}
            />
            {selectedPayment.razorpayPaymentId ? (
              <Row label="Razorpay ID" value={<span className="font-mono text-xs">{selectedPayment.razorpayPaymentId}</span>} />
            ) : null}
            {selectedPayment.razorpayOrderId ? (
              <Row label="Order ID" value={<span className="font-mono text-xs">{selectedPayment.razorpayOrderId}</span>} />
            ) : null}
            {selectedPayment.note ? <Row label="Note" value={selectedPayment.note} /> : null}
            {selectedPayment.status === 'rejected' && selectedPayment.rejectReason ? (
              <Row label="Rejection reason" value={<span className="text-rose-700">{selectedPayment.rejectReason}</span>} />
            ) : null}
            {proofSrc ? (
              <Row
                label="Proof"
                value={
                  <a href={proofSrc} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 hover:underline">
                    View screenshot
                  </a>
                }
                last
              />
            ) : (
              <Row label="Updated" value={formatDateTime(selectedPayment.updatedAt)} last />
            )}
          </dl>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/bookings/${id}/payment`)}
            className="mt-3 text-xs font-semibold text-teal-700 hover:underline"
          >
            View all payments for this booking
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Booking payment summary</h2>
        <dl className="mt-2">
          <Row label="Visit type" value={serviceTypeLabel(b.serviceType)} />
          <Row label="Payment mode" value={paymentModeLabel(b)} />
          <Row label="Plan total" value={paymentAmountLabel(b)} />
          <Row label="Received" value={<span className="text-emerald-700">{formatRupees(totalPaid)}</span>} />
          <Row
            label="Outstanding"
            value={
              <span className={outstanding > 0.009 ? 'text-rose-700' : 'text-emerald-700'}>
                {formatRupees(Math.max(0, outstanding))}
              </span>
            }
          />
          <Row label="Hold status" value={paymentStatusLabel(b.paymentStatus)} />
          <Row label="Payment step" value={marketplacePaymentStatusLabel(b.payment?.status)} />
          <Row label="Paid at" value={formatPaidAt(b) || '—'} last />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          {payments.length ? 'Payment history' : 'No installments yet'}
        </h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Payments and collections for this booking will appear here once recorded.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {payments.map((p) => {
              const active = String(p._id) === String(paymentId)
              return (
                <li key={p._id}>
                  <Link
                    to={`/dashboard/bookings/${id}/payment?paymentId=${p._id}`}
                    className={[
                      'flex items-center justify-between gap-3 py-3 transition',
                      active ? 'bg-teal-50/50 -mx-2 rounded-xl px-2' : 'hover:bg-slate-50 -mx-2 rounded-xl px-2',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tabular-nums text-slate-900">{formatRupees(p.amount)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {installmentModeLabel(p)} ·{' '}
                        {formatDateTime(p.verifiedAt || p.collectedAt || p.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                        STATUS_CHIP[p.status] || STATUS_CHIP.pending
                      }`}
                    >
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
