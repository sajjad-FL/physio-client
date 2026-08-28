export default function Card({ children, className = '', hover = true, as: Component = 'div', ...rest }) {
  return (
    <Component
      className={[
        'rounded-2xl border border-slate-100/90 bg-white p-6 shadow-sm transition-all duration-200',
        hover && 'hover:border-slate-200/90 hover:shadow-md',
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
