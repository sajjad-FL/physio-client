import { Link } from 'react-router-dom'

/**
 * Shared page header for admin sections — breadcrumbs, title, optional action links.
 */
export default function AdminPageHeader({ title, subtitle, breadcrumbs = [], actions = null }) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={crumb.label} className="inline-flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-slate-300">/</span>}
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="font-medium text-teal-700 hover:text-teal-900 hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-slate-700' : ''}>{crumb.label}</span>
                )}
              </span>
            )
          })}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="type-page-title">{title}</h1>
          {subtitle && <p className="type-caption mt-1 max-w-2xl sm:text-sm sm:leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

export function AdminLink({ to, children }) {
  return (
    <Link to={to} className="text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline">
      {children}
    </Link>
  )
}
