import { Link } from 'react-router-dom'
import { ISSUE_OPTIONS } from '../constants/issues'
import SiteHeader from '../components/layout/SiteHeader'
import FeaturedPhysiosSection from '../components/home/FeaturedPhysiosSection'

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
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-mesh-hero">
          <div className="pointer-events-none absolute inset-0 bg-grid-saas opacity-40" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="motion-safe:animate-enter inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur">
                Home visits · Verified clinicians
              </p>
              <h1 className="motion-safe:animate-enter-up animate-delay-1 mt-8 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.08]">
                Find Trusted Physiotherapists Near You
              </h1>
              <p className="motion-safe:animate-enter-up animate-delay-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
                Expert care for back pain, knee pain, and recovery — without the clinic commute. Simple booking, secure
                payment, and a therapist matched to your area.
              </p>
              <div className="motion-safe:animate-enter-up animate-delay-3 mt-12 flex flex-col items-center justify-center">
                <Link
                  to="/book"
                  className="interactive-press inline-flex h-12 min-w-[10rem] items-center justify-center rounded-xl bg-teal-600 px-8 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
                >
                  Book Now
                </Link>
              </div>
              <p className="motion-safe:animate-enter-up animate-delay-4 mt-6">
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline"
                >
                  How it works
                </a>
              </p>
            </div>

            <div className="motion-safe:animate-enter-up animate-delay-5 mx-auto mt-20 max-w-4xl lg:mt-24">
              <div className="surface-card rounded-2xl p-2.5 ring-1 ring-slate-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-5 py-3.5 text-sm text-slate-500">
                  <span className="font-medium text-slate-900">Today&apos;s flow</span>
                  <span className="rounded-lg bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                    OTP → slot → pay
                  </span>
                </div>
                <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
                  {flowSteps.map((label, i) => (
                    <div key={label} className="bg-white px-6 py-7 transition-colors duration-200 sm:py-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{String(i + 1).padStart(2, '0')}</p>
                      <p className="mt-3 text-[15px] font-semibold text-slate-900">{label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{flowCopy[i]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-slate-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">What we help with</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-500">
                Common conditions our physiotherapists treat during home visits.
              </p>
            </div>
            <div className="mt-16 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-px lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-slate-200 lg:shadow-sm">
              {services.map((s, i) => (
                <div
                  key={s.title}
                  className={
                    'interactive-lift group rounded-2xl border border-slate-200 bg-slate-50/50 p-7 motion-safe:animate-enter-up lg:border-0 lg:bg-white ' +
                    ['animate-delay-2', 'animate-delay-3', 'animate-delay-4', 'animate-delay-5'][i]
                  }
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-all duration-300 ease-out group-hover:bg-teal-600 group-hover:text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{s.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-grid-saas py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg leading-relaxed text-slate-500">
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FeaturedPhysiosSection />

        <section id="book" className="border-t border-slate-200 bg-white py-24 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Ready to book?</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-slate-500">
              Sign in with your phone, pick a slot, and pay to confirm — we&apos;ll handle the rest.
            </p>
            <div className="mt-12">
              <Link
                to="/book"
                className="interactive-press inline-flex h-12 items-center justify-center rounded-xl bg-teal-600 px-10 text-[15px] font-semibold text-white shadow-lg shadow-teal-600/25 transition-colors duration-200 hover:bg-teal-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-14 sm:flex-row sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">PhysioCare</p>
            <p className="mt-2 text-sm text-white/60">&copy; {new Date().getFullYear()} Home visit physiotherapy.</p>
          </div>
          <Link
            to="/register-physio"
            className="text-sm font-medium text-white/90 transition-colors duration-200 hover:text-white"
          >
            Register as a physio →
          </Link>
        </div>
      </footer>
    </div>
  )
}
