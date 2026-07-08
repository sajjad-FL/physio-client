import {
  formatPaidAt,
  formatBookingVisitWithCondition,
  marketplacePaymentStatusLabel,
  paymentAmountLabel,
  paymentModeLabel,
  paymentStatusLabel,
  sessionStatusLabel,
} from '../../../utils/bookingDisplay'
import { formatBookingDateAndSlot } from '../../../utils/date'
import { paymentBadge, bookingStatusBadge } from '../../../pages/dashboard/dashboardUtils'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import InstallmentsCard from '../../payments/InstallmentsCard'
import RazorpayPayButton from '../../RazorpayPayButton'
import PatientPhysioCard from './PatientPhysioCard'

export default function BookingDetailHeader({ booking: b, onRaiseDispute }) {
  const st = bookingStatusBadge(b.status, b.sessionStatus, b.paymentStatus)
  const pay = paymentBadge(b.paymentStatus)
  const physio = typeof b.physioId === 'object' ? b.physioId : null

  return (
    <>
      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Visit</p>
        <p className="type-page-title mt-1 text-ink">{formatBookingVisitWithCondition(b)}</p>
        {b.rescheduled && b.previousDate ? (
          <p className="mt-2 text-xs text-amber-800">
            Rescheduled from {formatBookingDateAndSlot(b.previousDate, b.previousTimeSlot)}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${st.cls}`}>{st.label}</span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${pay.cls}`}>{pay.label}</span>
          <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
            Session: {sessionStatusLabel(b)}
          </span>
        </div>
        <div className="mt-5 border-t border-border-subtle/80 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Physiotherapist</p>
          {physio?._id ? (
            <PatientPhysioCard physio={physio} />
          ) : (
            <p className="mt-2 text-sm text-slate-600">Matching with a physiotherapist — we are assigning a specialist for your care.</p>
          )}
        </div>
        {b.sessionStatus !== 'completed' ? (
          <div className="mt-4 border-t border-border-subtle/80 pt-4">
            <button
              type="button"
              onClick={onRaiseDispute}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Raise Dispute
            </button>
          </div>
        ) : null}
      </Card>
    </>
  )
}

export function PaymentsTabPanel({
  booking: b,
  paymentSummary,
  paymentsList,
  sessionsCount,
  isOfflinePlan,
  isOnlineBooking,
  outstanding,
  planReady,
  showInstallments,
  canPayInstallment,
  showLegacyPay,
  showOfflineMsg,
  useWalletCredit,
  setUseWalletCredit,
  walletBalance,
  onPayInstallment,
  onPaid,
}) {
  const pay = paymentBadge(b.paymentStatus)
  const paidLine = formatPaidAt(b)
  const totalAmount = Number(paymentSummary?.totalAmount ?? b.totalAmount ?? b.payment?.amount ?? 0)
  const totalPaid = Number(paymentSummary?.totalPaid ?? b.totalPaid ?? 0)
  const totalCollected = Number(paymentSummary?.totalCollected ?? 0)
  const effectivePaid = totalPaid + totalCollected
  const milestoneStatus = Array.isArray(paymentSummary?.milestoneStatus) ? paymentSummary.milestoneStatus : null
  const paidSoFar = Math.max(0, totalAmount - outstanding)
  const progressPct = totalAmount > 0 ? Math.round((paidSoFar / totalAmount) * 100) : 0

  return (
    <div className="space-y-5">
      {(outstanding > 0.009 || totalAmount > 0) && (
        <Card hover={false} className="border-border-subtle p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Plan Billing Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total plan value</p>
              <p className="type-stat mt-1 text-slate-900">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending payment</p>
              <p className={`type-stat mt-1 ${outstanding > 0.009 ? 'text-rose-700' : 'text-emerald-700'}`}>
                ₹{outstanding.toFixed(2)}
              </p>
            </div>
          </div>
          {totalAmount > 0 ? (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Payment progress</span>
                <span>
                  ₹{paidSoFar.toFixed(2)} paid ({progressPct}%)
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {milestoneStatus?.length > 0 ? (
        <Card hover={false} className="border-border-subtle p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Payment Schedule</h2>
          <ul className="mt-4 space-y-2">
            {milestoneStatus.map((m) => {
              const reqAmt = Math.ceil(m.requiredPct * totalAmount)
              const remainingToPay = Math.max(0, reqAmt - effectivePaid)
              return (
                <li
                  key={m.bySession}
                  className={[
                    'flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm',
                    m.met ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/40',
                  ].join(' ')}
                >
                  <div>
                    <p className="font-medium text-slate-900">After session #{m.bySession}</p>
                    <p className="text-xs text-slate-600">
                      {m.met ? 'Paid' : `Pending (You need to pay ₹${remainingToPay.toLocaleString('en-IN')})`}
                    </p>
                  </div>
                  <span className={m.met ? 'text-emerald-700' : 'text-amber-800'}>{m.met ? '✓' : '○'}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : null}

      {showInstallments ? (
        <InstallmentsCard
          title={isOfflinePlan ? 'Collections' : 'Installments'}
          subtitle={
            isOfflinePlan
              ? 'Your physiotherapist will record each payment when you hand over cash or UPI. Your admin verifies before it counts as covered.'
              : 'Pay any amount toward your plan. Each installment unlocks the next session for completion.'
          }
          summary={paymentSummary}
          payments={paymentsList}
          emptyMessage={
            isOfflinePlan
              ? 'No collections yet. Your physiotherapist records them after each cash/UPI hand-off.'
              : 'No payments yet. Start with any amount — we recommend one session at a time.'
          }
        >
          {canPayInstallment ? (
            <Button type="button" onClick={onPayInstallment}>
              Pay next installment
            </Button>
          ) : null}
        </InstallmentsCard>
      ) : null}

      <Card hover={false} className="border-border-subtle p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Payment details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Mode</dt>
            <dd className="font-medium text-ink">{paymentModeLabel(b)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Status</dt>
            <dd>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${pay.cls}`}>{pay.label}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-semibold tabular-nums text-ink">{paymentAmountLabel(b)}</dd>
          </div>
          {totalAmount > 0 || totalPaid > 0 || outstanding > 0.009 ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Payment received</dt>
                <dd className="font-semibold tabular-nums text-emerald-700">₹{totalPaid.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Remaining pending</dt>
                <dd
                  className={`font-semibold tabular-nums ${outstanding > 0.009 ? 'text-rose-700' : 'text-emerald-700'}`}
                >
                  ₹{Math.max(0, outstanding).toFixed(2)}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment hold</dt>
            <dd className="text-ink">{paymentStatusLabel(b.paymentStatus)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment step</dt>
            <dd className="font-medium text-ink">{marketplacePaymentStatusLabel(b.payment?.status)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Paid at</dt>
            <dd className="text-ink">{paidLine || '—'}</dd>
          </div>
        </dl>
      </Card>

      {showOfflineMsg ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-medium">Offline payment</p>
          <p className="mt-1 text-xs text-amber-900/90">
            {b.payment?.status === 'collected'
              ? 'Your physiotherapist marked payment as collected. Our team will verify shortly — payment status updates after verification.'
              : 'Pay your physiotherapist as agreed (cash/UPI). They will mark payment as collected, then we verify before the session can be completed.'}
          </p>
        </div>
      ) : null}

      {showLegacyPay ? (
        <Card hover={false} className="border-border-subtle p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Pay online</h2>
          <p className="mt-1 text-xs text-ink-muted">Complete payment to confirm your booking.</p>
          {walletBalance > 0 ? (
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-teal-600"
                checked={useWalletCredit}
                onChange={(e) => setUseWalletCredit(e.target.checked)}
              />
              Use ₹{walletBalance.toFixed(0)} wallet credit
            </label>
          ) : null}
          <div className="mt-4">
            <RazorpayPayButton
              bookingId={b._id}
              onPaid={onPaid}
              useWalletCredit={useWalletCredit}
              walletBalance={walletBalance}
            />
          </div>
        </Card>
      ) : null}
    </div>
  )
}
