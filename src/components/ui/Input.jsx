import { forwardRef } from 'react'

const base =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm transition duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70'

const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={[base, className].filter(Boolean).join(' ')} {...props} />
})

export default Input
