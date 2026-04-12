import { useEffect, useState } from 'react'
import { api } from '../config/api'
import { validateLiveField } from '../utils/liveFieldValidation'
import toast from 'react-hot-toast'
import Button from './ui/Button'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

/**
 * Full-screen blocking modal — no dismiss control until the profile is saved.
 * @param {{ initial?: { name?: string, dob?: string | null, gender?: string | null }, onComplete: () => void }} props
 */
export default function ProfileCompletionModal({ initial, onComplete }) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!initial) return
    if (initial.name) setName(initial.name)
    if (initial.dob) setDob(String(initial.dob).slice(0, 10))
    if (initial.gender) setGender(initial.gender)
  }, [initial])

  async function submit(e) {
    e.preventDefault()
    const next = {
      name: validateLiveField('name', name),
      dob: validateLiveField('dob', dob),
      gender: validateLiveField('gender', gender, { requiredGender: true }),
    }
    setFieldErrors(next)
    if (Object.values(next).some(Boolean)) {
      toast.error('Please fix the highlighted fields')
      return
    }

    setBusy(true)
    try {
      await api.patch('/profile', {
        name: name.trim(),
        dob,
        gender,
      })
      setFieldErrors({})
      toast.success('Profile saved')
      onComplete()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-blue-600">One quick step</p>
          <h1 className="mt-2 text-center text-xl font-semibold text-gray-900">Complete your profile</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            We need a few details to personalize your experience and meet care standards.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="pc-name" className="block text-sm font-medium text-gray-800">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="pc-name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value
                  setName(v)
                  setFieldErrors((prev) => ({ ...prev, name: validateLiveField('name', v) }))
                }}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                className={`mt-1.5 h-11 w-full rounded-xl border bg-gray-50/80 px-3 text-gray-900 shadow-inner outline-none focus:ring-2 ${
                  fieldErrors.name
                    ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
                placeholder="As on official ID"
              />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>

            <div>
              <label htmlFor="pc-dob" className="block text-sm font-medium text-gray-800">
                Date of birth <span className="text-red-500">*</span>
              </label>
              <input
                id="pc-dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  const v = e.target.value
                  setDob(v)
                  setFieldErrors((prev) => ({ ...prev, dob: validateLiveField('dob', v) }))
                }}
                aria-invalid={Boolean(fieldErrors.dob)}
                className={`mt-1.5 h-11 w-full rounded-xl border bg-gray-50/80 px-3 text-gray-900 shadow-inner outline-none focus:ring-2 ${
                  fieldErrors.dob
                    ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              />
              {fieldErrors.dob ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dob}</p> : null}
            </div>

            <div>
              <label htmlFor="pc-gender" className="block text-sm font-medium text-gray-800">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="pc-gender"
                value={gender}
                onChange={(e) => {
                  const v = e.target.value
                  setGender(v)
                  setFieldErrors((prev) => ({
                    ...prev,
                    gender: validateLiveField('gender', v, { requiredGender: true }),
                  }))
                }}
                aria-invalid={Boolean(fieldErrors.gender)}
                className={`mt-1.5 h-11 w-full rounded-xl border bg-gray-50/80 px-3 text-gray-900 shadow-inner outline-none focus:ring-2 ${
                  fieldErrors.gender
                    ? 'border-red-400 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                }`}
              >
                <option value="">Select…</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {fieldErrors.gender ? <p className="mt-1 text-xs text-red-600">{fieldErrors.gender}</p> : null}
            </div>

            <Button type="submit" variant="primary" className="mt-2 h-12 w-full text-[15px]" disabled={busy}>
              {busy ? 'Saving…' : 'Save and continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
