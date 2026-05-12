import Button from '../ui/Button'
import { formatBookingDateAndSlot } from '../../utils/date'
import { formatPhysioSessionFeeLabel } from '../../utils/physioSessionFee.js'

/**
 * Sticky bottom booking summary + primary CTA.
 * When no `selectedPhysio`, copy explains that our team picks a physio.
 */
export default function BookingSummaryBar({
  selectedPhysio,
  date,
  timeSlot,
  serviceType,
  canSubmit,
  loading,
  onConfirm,
  /** Shown under the summary line (e.g. Razorpay test-mode pay instructions). */
  onlinePaymentHint,
}) {
  const priceLabel =
    selectedPhysio && selectedPhysio._id ? formatPhysioSessionFeeLabel(selectedPhysio) : null
  const teamAssigns = serviceType === 'home' || !selectedPhysio?._id
  const onlineNeedsPhysio = serviceType === 'online' && !selectedPhysio?._id

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Booking summary</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-gray-800">
              {onlineNeedsPhysio ? (
                <span className="font-semibold text-amber-800">
                  <span className="text-gray-500">Physio · </span>
                  Not selected — choose in step 4
                </span>
              ) : teamAssigns ? (
                <span className="font-semibold text-gray-900">
                  <span className="text-gray-500">Physio · </span>
                  Picked by our team
                </span>
              ) : (
                <span className="font-semibold text-gray-900">
                  <span className="text-gray-500">Physio · </span>
                  {selectedPhysio.name}
                </span>
              )}
              {date && timeSlot && (
                <span className="text-gray-600">{formatBookingDateAndSlot(date, timeSlot)}</span>
              )}
              {!teamAssigns && priceLabel && priceLabel !== '—' && (
                <span className="font-semibold tabular-nums text-gray-900">{priceLabel}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {serviceType === 'home'
                ? 'Home visit — our team will pick a physio after you confirm.'
                : onlineNeedsPhysio
                  ? 'Select a physiotherapist above before you can confirm.'
                  : teamAssigns
                    ? 'Online session — fee is confirmed at payment.'
                    : 'Online consultation'}
            </p>
            {serviceType === 'online' && onlinePaymentHint ? (
              <p className="text-[11px] leading-snug text-gray-500">{onlinePaymentHint}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="primary"
            className="h-12 w-full shrink-0 rounded-xl px-8 text-[15px] font-semibold shadow-lg shadow-blue-600/25 transition-all duration-200 hover:shadow-xl sm:w-auto sm:min-w-[200px]"
            disabled={!canSubmit || loading}
            onClick={onConfirm}
          >
            {loading ? 'Processing…' : 'Confirm & continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
