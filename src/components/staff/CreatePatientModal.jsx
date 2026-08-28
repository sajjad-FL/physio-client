import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { FormField } from '../ui/Input'
import { toastApiError } from '../../utils/formToast'

const emptyForm = { name: '', phone: '', password: '', confirmPassword: '' }

export default function CreatePatientModal({ open, onClose, apiPath, onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(emptyForm)
      setCreated(null)
      setBusy(false)
    }
  }, [open])

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const name = form.name.trim()
    const phone = form.phone.trim()
    const password = form.password
    if (name.length < 2) {
      toast.error("Enter the patient's full name")
      return
    }
    if (!phone) {
      toast.error('Enter a phone number')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setBusy(true)
    try {
      const res = await api.post(apiPath, { name, phone, password })
      const user = res.data?.user
      setCreated({
        name: user?.name || name,
        phone: user?.phone || phone,
        password,
      })
      toast.success('Patient account created')
      onCreated?.(user)
    } catch (err) {
      toastApiError(err, 'Could not create patient')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    if (busy) return
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={created ? 'Share with patient' : 'Add patient'}
      description={
        created
          ? 'Tell the patient these details so they can log in on the app or website later.'
          : 'Create an account for someone who does not have the app yet. Give them this phone and password to log in later.'
      }
      centered
    >
      {created ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 text-sm text-slate-800">
            <p>
              <span className="text-slate-500">Name</span>
              <br />
              <span className="font-semibold">{created.name}</span>
            </p>
            <p className="mt-3">
              <span className="text-slate-500">Phone</span>
              <br />
              <span className="font-semibold tabular-nums">{created.phone}</span>
            </p>
            <p className="mt-3">
              <span className="text-slate-500">Temporary password</span>
              <br />
              <span className="font-semibold">{created.password}</span>
            </p>
          </div>
          <p className="text-xs text-slate-500">
            They can change the password later with Forgot password on the login screen.
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full name" required>
            <Input value={form.name} onChange={update('name')} autoComplete="name" placeholder="Patient name" />
          </FormField>
          <FormField label="Phone" required>
            <Input
              value={form.phone}
              onChange={update('phone')}
              autoComplete="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
            />
          </FormField>
          <FormField label="Temporary password" required>
            <Input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
          </FormField>
          <FormField label="Confirm password" required>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              autoComplete="new-password"
              placeholder="Type password again"
            />
          </FormField>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button type="button" variant="outline" disabled={busy} onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Create account
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
