import { useEffect, useMemo, useRef } from 'react'

export default function OtpInput({ value, onChange, length = 6, disabled = false }) {
  const refs = useRef([])
  const otp = useMemo(() => String(value || ''), [value])

  useEffect(() => {
    // Focus the first empty box when user clears or changes the OTP externally.
    const firstEmptyIndex = Array.from({ length }).findIndex((_, i) => !otp[i])
    if (!disabled && firstEmptyIndex >= 0) refs.current[firstEmptyIndex]?.focus()
  }, [disabled, length, otp])

  function setDigitAt(i, digit) {
    const digits = Array.from({ length }, (_, idx) => otp[idx] || '')
    digits[i] = digit
    onChange(digits.join(''))
  }

  function handleKeyDown(e, i) {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) {
        refs.current[i - 1]?.focus()
      }
      // If there is a digit, clearing is handled by onChange on input event.
      return
    }
  }

  return (
    <div className="flex flex-row gap-2.5 sm:gap-3">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={otp[i] || ''}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onChange={(e) => {
            const raw = e.target.value || ''
            const digit = raw.replace(/\D/g, '').slice(0, 1)
            setDigitAt(i, digit)
          }}
          className="h-12 w-10 rounded-lg border border-border-subtle bg-white text-center text-lg font-semibold tabular-nums text-ink shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      ))}
    </div>
  )
}

