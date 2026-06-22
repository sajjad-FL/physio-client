import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SiteHeader from '../components/layout/SiteHeader'
import { ShieldCheck, Lock, MapPin, Eye, FileText, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const lastUpdated = 'May 31, 2026'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between">
      <Helmet>
        <title>Privacy Policy | PhysiOkhom</title>
        <meta name="description" content="Privacy Policy for PhysiOkhom physiotherapy service platform. Learn how we collect, use, and protect your personal and medical information." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div>
        <SiteHeader />

        <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="border-b border-slate-100 pb-6 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 mb-4">
                <ShieldCheck size={13} className="animate-pulse" />
                <span>Security & Trust</span>
              </div>
              <h1 className="type-hero">Privacy Policy</h1>
              <p className="mt-2 text-sm text-slate-500 font-medium">Last Updated: {lastUpdated}</p>
            </div>

            <div className="space-y-8 text-[15px] leading-relaxed text-slate-600">
              <section className="space-y-3">
                <p>
                  At <strong>PhysiOkhom</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we are committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, and share your information when you use our website (physiokhom.com) and our mobile applications (collectively, the &quot;Platform&quot;).
                </p>
                <p>
                  By accessing or using our Platform, you agree to the collection and use of information in accordance with this policy. If you do not agree with any terms in this policy, please do not access the Platform or register for services.
                </p>
              </section>

              {/* 1. Information Collection */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title flex items-center gap-2.5">
                  <FileText size={18} className="text-teal-600" />
                  1. Information We Collect
                </h2>
                <p>
                  We collect information to provide, coordinate, and improve our home-visit clinical physiotherapy services. This includes:
                </p>
                <ul className="list-disc pl-5 space-y-2.5">
                  <li>
                    <strong>Personal Identity Information:</strong> Name, phone number, email address, age, gender, and registration credentials.
                  </li>
                  <li>
                    <strong>Location Information:</strong> Precise home/work address coordinates (via GPS or manual input) to match and dispatch therapists to your specific location for at-home sessions.
                  </li>
                  <li>
                    <strong>Device Media & Camera:</strong> We access your device camera and photo library (upon receiving your permission) to allow you to upload profile pictures or avatars and, for physiotherapists, to submit qualification certificates, identity proofs, and other professional registration documents required during onboarding.
                  </li>
                  <li>
                    <strong>Clinical & Medical Data:</strong> Symptoms, diagnosis details, referral notes, prescription attachments, and progress logs recorded by physiotherapists to plan and execute safe clinical treatment plans.
                  </li>
                  <li>
                    <strong>Billing & Transactions:</strong> Payment records and transaction history. We do not store raw card numbers or bank credentials on our servers; payments are processed securely through certified gateways (such as Razorpay).
                  </li>
                </ul>
              </section>

              {/* 2. How We Use Data */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title flex items-center gap-2.5">
                  <Eye size={18} className="text-teal-600" />
                  2. How We Use Your Information
                </h2>
                <p>
                  We use your personal and clinical data for the following essential business purposes:
                </p>
                <ul className="list-disc pl-5 space-y-2.5">
                  <li>To coordinate, schedule, and assign clinical physiotherapy home-visit plans.</li>
                  <li>To share your address and symptom details with the assigned physiotherapist so they can deliver care at your home.</li>
                  <li>To track appointments and facilitate real-time updates regarding therapist arrival.</li>
                  <li>To process payments and refunds securely.</li>
                  <li>To send service notifications, receipts, and important security alerts.</li>
                  <li>To address customer support issues, disputes, or complaints.</li>
                </ul>
              </section>

              {/* 3. Data Sharing */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title flex items-center gap-2.5">
                  <MapPin size={18} className="text-teal-600" />
                  3. Information Sharing & Disclosure
                </h2>
                <p>
                  We do not sell, rent, or trade your personal data. We share your information in the following limited circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2.5">
                  <li>
                    <strong>With Physiotherapists:</strong> We disclose your name, phone number, address, and physical symptoms to the matched therapist assigned to your care plan to enable service delivery.
                  </li>
                  <li>
                    <strong>With Service Providers:</strong> We share billing data with our payment processors (e.g. Razorpay) and sms alert details with communication providers.
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> We may disclose information if required by applicable Indian laws or valid court directives to protect platform integrity or safety.
                  </li>
                </ul>
              </section>

              {/* 4. Security */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title flex items-center gap-2.5">
                  <Lock size={18} className="text-teal-600" />
                  4. Data Security & Storage
                </h2>
                <p>
                  Your information is stored securely on servers in India. We employ industry-standard administrative and technological safeguards:
                </p>
                <ul className="list-disc pl-5 space-y-2.5">
                  <li>All communication on our Platform is encrypted using Secure Socket Layer (SSL/TLS) technology.</li>
                  <li>Access to clinical notes and patient records is restricted strictly to the patient, assigned therapists, and designated system administrators.</li>
                  <li>We recommend using unique authentication tokens and keeping password codes secure to prevent unauthorised access.</li>
                </ul>
              </section>

              {/* 5. User Rights */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-teal-600" />
                  5. Your Rights & Data Deletion
                </h2>
                <p>
                  You have the right to view, update, or correct your personal profile information at any time from your dashboard profile page.
                </p>
                <p>
                  If you wish to deactivate your account or request the permanent deletion of your personal data from our servers, you may send a deletion request to our support desk at <span className="font-semibold text-slate-800">support@physiokhom.com</span>. We will delete or anonymise your records within 30 days, except where retention is legally mandated.
                </p>
              </section>

              {/* 6. Contacts */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="type-page-title">6. Contact Information</h2>
                <p>
                  If you have questions or concerns regarding this Privacy Policy, please contact us at:
                </p>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-1.5 text-sm font-medium text-slate-700">
                  <p className="text-slate-950 font-bold">PhysiOkhom Care Coordination Desk</p>
                  <p>Guwahati, Assam, India</p>
                  <p>Email: support@physiokhom.com</p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-800 bg-slate-900 text-white mt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">PhysiOkhom</p>
            <p className="mt-2 text-sm text-white/60">&copy; {new Date().getFullYear()} PhysiOkhom. All rights reserved.</p>
          </div>
          <nav className="flex gap-x-6 text-sm font-medium text-white/90" aria-label="Footer Navigation">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/book" className="hover:text-white">Book Physio</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
