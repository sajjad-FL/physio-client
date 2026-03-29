import LocationAutocomplete from '../booking/LocationAutocomplete'
import Button from '../ui/Button'

/**
 * Shared row: address search + map button (same pattern as Profile address section).
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (v: string) => void,
 *   onPlaceResolved: (place: { lat: number, lng: number, label: string } | null) => void,
 *   onOpenMap: () => void,
 *   disabled?: boolean,
 *   placeholder?: string,
 *   mapButtonLabel?: string,
 * }} props
 */
export default function LocationSelectorRow({
  id = 'loc-selector',
  value,
  onChange,
  onPlaceResolved,
  onOpenMap,
  disabled,
  placeholder,
  mapButtonLabel = 'Pick on map',
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <LocationAutocomplete
        id={id}
        value={value}
        onChange={onChange}
        onPlaceResolved={onPlaceResolved}
        disabled={disabled}
        placeholder={placeholder}
      />
      <Button type="button" variant="outline" className="h-11 rounded-xl whitespace-nowrap" onClick={onOpenMap}>
        {mapButtonLabel}
      </Button>
    </div>
  )
}
