import Button from '../ui/Button'
import { formatBookingDateAndSlot } from '../../utils/date'

/**
 * Sticky bottom booking summary + primary CTA.
 * When no `selectedPhysio`, copy assumes admin/team assignment after booking.
 */
export default function BookingSummaryBar({
  selectedPhysio,
  date,
  timeSlot,
  serviceType,
  canSubmit,
  loading,
  onConfirm,
}) {
  const price = selectedPhysio?.pricePerSession
  const teamAssigns = !selectedPhysio?._id

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Booking summary</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-gray-800">
              {teamAssigns ? (
                <span className="font-semibold text-gray-900">
                  <span className="text-gray-500">Physio · </span>
                  Assigned by our team
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
              {!teamAssigns && price != null && (
                <span className="font-semibold tabular-nums text-gray-900">₹{price}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {serviceType === 'home'
                ? 'Home visit — a physiotherapist will be assigned after you confirm.'
                : teamAssigns
                  ? 'Online session — fee is confirmed at payment.'
                  : 'Online consultation'}
            </p>
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
