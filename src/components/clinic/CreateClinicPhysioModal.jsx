import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input, { FormField } from '../ui/Input'
import { toastApiError } from '../../utils/formToast'

const emptyForm = {
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
  specialization: '',
}

export default function CreateClinicPhysioModal({ open, onClose, onCreated }) {
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
    const specialization = form.specialization.trim()
    const password = form.password
    if (name.length < 2) {
      toast.error("Enter the physiotherapist's name")
      return
    }
    if (!phone) {
      toast.error('Enter a phone number')
      return
    }
    if (specialization.length < 2) {
      toast.error('Enter a specialization')
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
      const res = await api.post('/clinic/physios', { name, phone, password, specialization })
      const physio = res.data?.physio
      const user = res.data?.user
      setCreated({
        name: physio?.name || name,
        phone: physio?.phone || user?.phone || phone,
        password,
        specialization: physio?.specialization || specialization,
      })
      toast.success('Physiotherapist added to clinic')
      onCreated?.(physio)
    } catch (err) {
      toastApiError(err, 'Could not add physiotherapist')
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
      title={created ? 'Share login details' : 'Add clinic physiotherapist'}
      description={
        created
          ? 'Give them these details so they can sign in to the physio portal.'
          : 'Create a physiotherapist account for your clinic. They will appear on your roster for case assignment.'
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
              <span className="text-slate-500">Specialization</span>
              <br />
              <span className="font-semibold">{created.specialization}</span>
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
          <div className="flex justify-end">
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Full name" required>
            <Input value={form.name} onChange={update('name')} placeholder="Physiotherapist name" />
          </FormField>
          <FormField label="Phone" required>
            <Input
              value={form.phone}
              onChange={update('phone')}
              inputMode="numeric"
              placeholder="10-digit mobile"
            />
          </FormField>
          <FormField label="Specialization" required>
            <Input
              value={form.specialization}
              onChange={update('specialization')}
              placeholder="e.g. Orthopaedic, Sports rehab"
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
              Add physiotherapist
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
