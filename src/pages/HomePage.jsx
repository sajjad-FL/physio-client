import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ISSUE_OPTIONS } from '../constants/issues'
import { getToken, getRoles, getDefaultDashboardPath } from '../auth/session'

const services = ISSUE_OPTIONS.map((title) => ({
  title,
  blurb:
    title === 'Post Surgery Rehab'
      ? 'Guided recovery at home after your procedure.'
      : `Focused care and exercises for ${title.toLowerCase()}.`,
}))

const steps = [
  { title: 'Book', text: 'Share your details and what you need help with.' },
  { title: 'Get assigned', text: 'We match you with a qualified physiotherapist.' },
  { title: 'Get treatment', text: 'Receive expert therapy in the comfort of your home.' },
]

const flowSteps = ['Choose slot', 'Confirm details', 'Pay securely']
const flowCopy = [
  'Pick a date that works for you.',
  'Tell us what you need help with.',
  'Razorpay checkout — then we assign a physio.',
]

export default function HomePage() {
  const [open, setOpen] = useState(false)
  const token = getToken()
  const roles = getRoles()
  const isAdmin = roles.includes('admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-gray-900 transition-opacity duration-200 hover:opacity-80"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-200 ease-out motion-safe:hover:scale-105"
              aria-hidden
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
            PhysioCare
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm"
          >
            {open ? '✕' : '☰'}
          </button>
          <nav className="hidden md:flex flex-wrap items-center justify-end gap-0.5 text-sm font-medium text-gray-500 sm:gap-1">
            <a
              href="#services"
              className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-black/3 hover:text-gray-900"
            >
              Services
            </a>
            <Link
              to="/book"
              className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-black/3 hover:text-gray-900"
            >
              Book
            </Link>
            {token ? (
              <Link
                to={getDefaultDashboardPath()}
                className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-black/3 hover:text-gray-900"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-black/3 hover:text-gray-900"
              >
                Sign in
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="ml-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        {open && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              <a href="#services" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                Services
              </a>
              <Link to="/book" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                Book
              </Link>
              {token ? (
                <Link to={getDefaultDashboardPath()} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                  Sign in
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm">
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-gray-200 bg-mesh-hero">
          <div className="pointer-events-none absolute inset-0 bg-grid-saas opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="motion-safe:animate-enter inline-flex items-center rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 shadow-sm backdrop-blur">
                Home visits · India
              </p>
              <h1 className="motion-safe:animate-enter-up animate-delay-1 mt-8 text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl sm:leading-[1.08]">
                Book trusted physiotherapists at home
              </h1>
              <p className="motion-safe:animate-enter-up animate-delay-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
                Expert care for back pain, knee pain, and recovery — without the clinic commute. Simple booking,
                secure payment, and a therapist matched to your area.
              </p>
              <div className="motion-safe:animate-enter-up animate-delay-3 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-8 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(10,37,64,0.08),0_4px_12px_rgba(99,91,255,0.35)] transition-colors duration-200 hover:bg-blue-700"
                >
                  Book a session
                </Link>
                <a
                  href="#how-it-works"
                  className="interactive-press inline-flex h-12 items-center justify-center rounded-lg border border-gray-200 bg-white px-8 text-[15px] font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-ink/12 hover:shadow-md"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="motion-safe:animate-enter-up animate-delay-5 mx-auto mt-20 max-w-4xl lg:mt-24">
              <div className="surface-card rounded-2xl p-2.5 ring-1 ring-black/2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-5 py-3.5 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Today&apos;s flow</span>
                  <span className="rounded-md bg-white px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-border-subtle">
                    OTP → slot → pay
                  </span>
                </div>
                <div className="grid gap-px bg-gray-200 sm:grid-cols-3">
                  {flowSteps.map((label, i) => (
                    <div
                      key={label}
                      className="bg-white px-6 py-7 transition-colors duration-200 sm:py-8"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{String(i + 1).padStart(2, '0')}</p>
                      <p className="mt-3 text-[15px] font-semibold text-gray-900">{label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500">{flowCopy[i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-gray-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">What we help with</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-500">
                Common conditions our physiotherapists treat during home visits.
              </p>
            </div>
            <div className="mt-16 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-px lg:overflow-hidden lg:rounded-2xl lg:border lg:border-gray-200 lg:bg-gray-200 lg:shadow-sm">
              {services.map((s, i) => (
                <div
                  key={s.title}
                  className={
                    'interactive-lift group rounded-2xl border border-gray-200 bg-gray-50/50 p-7 motion-safe:animate-enter-up lg:border-0 lg:bg-white ' +
                    ['animate-delay-2', 'animate-delay-3', 'animate-delay-4', 'animate-delay-5'][i]
                  }
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 ease-out group-hover:bg-blue-600 group-hover:text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{s.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-grid-saas py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-relaxed text-gray-500">
              Three calm steps from request to treatment.
            </p>
            <div className="mt-16 grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className={
                    'surface-card relative rounded-2xl p-8 md:p-9 motion-safe:animate-enter-up ' +
                    ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'][i]
                  }
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="book" className="border-t border-gray-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Ready to book?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-gray-500">
              Sign in with your phone, pick a slot, and pay to confirm — we&apos;ll handle the rest.
            </p>
            <div className="mt-12">
              <Link
                to="/book"
                className="interactive-press inline-flex h-12 items-center justify-center rounded-lg bg-blue-600 px-10 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(10,37,64,0.08),0_4px_12px_rgba(99,91,255,0.35)] transition-colors duration-200 hover:bg-blue-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-14 sm:flex-row sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">PhysioCare</p>
            <p className="mt-2 text-sm text-white/60">&copy; {new Date().getFullYear()} Home visit physiotherapy.</p>
          </div>
          <Link
            to="/admin"
            className="text-sm font-medium text-white/80 transition-colors duration-200 hover:text-white"
          >
            Admin dashboard →
          </Link>
        </div>
      </footer>
    </div>
  )
}
