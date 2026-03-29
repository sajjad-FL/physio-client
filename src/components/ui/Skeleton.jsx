export default function Skeleton({ className = '', ...rest }) {
  return (
    <div
      className={['animate-pulse rounded-xl bg-gray-200/80', className].filter(Boolean).join(' ')}
      role="presentation"
      {...rest}
    />
  )
}
