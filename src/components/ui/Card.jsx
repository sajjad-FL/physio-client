export default function Card({ children, className = '', hover = true, as: Component = 'div', ...rest }) {
  return (
    <Component
      className={[
        'rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200',
        hover && 'hover:shadow-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  )
}
