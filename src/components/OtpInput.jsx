import { useEffect, useMemo, useRef } from 'react'

export default function OtpInput({ value, onChange, length = 4, disabled = false }) {
  const refs = useRef([])
  const otp = useMemo(() => String(value || ''), [value])

  useEffect(() => {
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
      return
    }
  }

  return (
    <div className="grid grid-cols-4 gap-3">
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
          className="box-border h-14 w-full min-w-0 rounded-lg border border-border-subtle bg-white p-0 text-center text-2xl font-semibold tabular-nums leading-14 text-ink shadow-sm outline-none transition-all duration-200 [appearance:textfield] focus:border-brand focus:ring-2 focus:ring-brand/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      ))}
    </div>
  )
}
