import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DEFAULT_QUALIFICATION_DECLARATION } from '../../constants/qualificationDeclaration'
import { assetUrl } from '../../utils/assetUrl'
import { prepareUploadFile } from '../../utils/compressImage.js'

export default function AdminPlatformSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingReferral, setSavingReferral] = useState(false)
  const [declarationText, setDeclarationText] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [referralRewardAmount, setReferralRewardAmount] = useState(300)
  const [referralSignupBonusAmount, setReferralSignupBonusAmount] = useState(100)
  const [referralUpdatedAt, setReferralUpdatedAt] = useState(null)
  const [signupBonusUpdatedAt, setSignupBonusUpdatedAt] = useState(null)
  const [phonePeQrUrl, setPhonePeQrUrl] = useState('')
  const [phonePeQrUpdatedAt, setPhonePeQrUpdatedAt] = useState(null)
  const [uploadingQr, setUploadingQr] = useState(false)
  const [clearingQr, setClearingQr] = useState(false)
  const qrInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/platform/settings')
      setDeclarationText(data.qualificationDeclarationResolved || DEFAULT_QUALIFICATION_DECLARATION)
      setUpdatedAt(data.qualificationDeclarationUpdatedAt || null)
      const amt = Number(data.referralRewardAmount)
      setReferralRewardAmount(Number.isFinite(amt) && amt > 0 ? Math.round(amt) : 300)
      setReferralUpdatedAt(data.referralRewardAmountUpdatedAt || null)
      const bonus = Number(data.referralSignupBonusAmount)
      setReferralSignupBonusAmount(Number.isFinite(bonus) && bonus >= 0 ? Math.round(bonus) : 100)
      setSignupBonusUpdatedAt(data.referralSignupBonusAmountUpdatedAt || null)
      setPhonePeQrUrl(data.phonePeQrUrl || '')
      setPhonePeQrUpdatedAt(data.phonePeQrUpdatedAt || null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load platform settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const trimmed = declarationText.trim()
      const { data } = await api.patch('/admin/platform/settings', {
        qualificationDeclarationText: trimmed === DEFAULT_QUALIFICATION_DECLARATION.trim() ? '' : trimmed,
      })
      toast.success(data.message || 'Declaration saved')
      setUpdatedAt(data.qualificationDeclarationUpdatedAt || null)
      setDeclarationText(data.qualificationDeclarationResolved || DEFAULT_QUALIFICATION_DECLARATION)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function onRestoreDefault() {
    setDeclarationText(DEFAULT_QUALIFICATION_DECLARATION)
  }

  async function onSaveReferral(e) {
    e.preventDefault()
    setSavingReferral(true)
    try {
      const amount = Math.round(Number(referralRewardAmount))
      const signupBonus = Math.round(Number(referralSignupBonusAmount))
      const { data } = await api.patch('/admin/platform/settings', {
        referralRewardAmount: amount,
        referralSignupBonusAmount: signupBonus,
      })
      toast.success(data.message || 'Referral settings saved')
      const resolved = Number(data.referralRewardAmount)
      setReferralRewardAmount(Number.isFinite(resolved) && resolved > 0 ? Math.round(resolved) : amount)
      setReferralUpdatedAt(data.referralRewardAmountUpdatedAt || null)
      const resolvedBonus = Number(data.referralSignupBonusAmount)
      setReferralSignupBonusAmount(
        Number.isFinite(resolvedBonus) && resolvedBonus >= 0 ? Math.round(resolvedBonus) : signupBonus,
      )
      setSignupBonusUpdatedAt(data.referralSignupBonusAmountUpdatedAt || null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSavingReferral(false)
    }
  }

  async function onUploadQr(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingQr(true)
    try {
      if (file.size > 400 * 1024) toast.loading('Optimizing image…', { id: 'img-compress' })
      const prepared = await prepareUploadFile(file, 'payment')
      toast.dismiss('img-compress')
      const form = new FormData()
      form.append('qr', prepared)
      const { data } = await api.post('/admin/platform/settings/phonepe-qr', form)
      setPhonePeQrUrl(data.phonePeQrUrl || '')
      setPhonePeQrUpdatedAt(data.phonePeQrUpdatedAt || null)
      toast.success(data.message || 'PhonePe QR saved')
    } catch (err) {
      toast.dismiss('img-compress')
      toast.error(err.response?.data?.message || err?.message || 'Upload failed')
    } finally {
      setUploadingQr(false)
    }
  }

  async function onClearQr() {
    if (
      !window.confirm(
        'Remove the PhonePe QR? Managers will not be able to collect via PhonePe until you upload another.',
      )
    ) {
      return
    }
    setClearingQr(true)
    try {
      const { data } = await api.delete('/admin/platform/settings/phonepe-qr')
      setPhonePeQrUrl('')
      setPhonePeQrUpdatedAt(data.phonePeQrUpdatedAt || null)
      toast.success(data.message || 'PhonePe QR removed')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove QR')
    } finally {
      setClearingQr(false)
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-slate-600">Loading platform settings…</p>
  }

  const qrSrc = assetUrl(phonePeQrUrl)

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="type-page-title text-slate-900">Platform documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Text shown to physiotherapists during registration and onboarding. They must check &quot;I agree&quot; before
          submitting. Leaving the saved text empty (restore default) uses the built-in PhysiOkhom template.
        </p>
      </div>

      <Card>
        <h2 className="type-page-title text-slate-900">PhonePe QR</h2>
        <p className="mt-2 text-sm text-slate-600">
          Managers show this QR to patients for UPI payment. After the patient pays, the manager uploads a
          screenshot for you to confirm in Finance → Payment queue. Cash collections stay unchanged.
        </p>
        {phonePeQrUpdatedAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Last updated: {new Date(phonePeQrUpdatedAt).toLocaleString()}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {qrSrc ? (
              <img src={qrSrc} alt="PhonePe QR code" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="px-3 text-center text-xs text-slate-500">No QR uploaded yet</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={qrInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onUploadQr}
            />
            <Button
              type="button"
              loading={uploadingQr}
              disabled={uploadingQr || clearingQr}
              onClick={() => qrInputRef.current?.click()}
            >
              {phonePeQrUrl ? 'Replace QR' : 'Upload QR'}
            </Button>
            {phonePeQrUrl ? (
              <Button
                type="button"
                variant="outline"
                loading={clearingQr}
                disabled={uploadingQr || clearingQr}
                onClick={onClearQr}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="type-page-title text-slate-900">Qualification declaration</h2>
        <p className="mt-2 text-sm text-slate-600">
          This replaces the old PDF NDA download and upload flow. Edit the wording as needed for your jurisdiction;
          keep it accurate and readable.
        </p>
        {updatedAt ? (
          <p className="mt-2 text-xs text-slate-500">Last saved: {new Date(updatedAt).toLocaleString()}</p>
        ) : null}

        <form onSubmit={onSave} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="admin-declaration-text">
              Declaration text (max 8,000 characters)
            </label>
            <textarea
              id="admin-declaration-text"
              value={declarationText}
              onChange={(e) => setDeclarationText(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={saving} disabled={saving}>
              Save declaration
            </Button>
            <Button type="button" variant="outline" onClick={onRestoreDefault} disabled={saving}>
              Restore default wording
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="type-page-title text-slate-900">Referral program</h2>
        <p className="mt-2 text-sm text-slate-600">
          Configure what referrers and their friends earn. Amounts are shown on Refer &amp; Earn and at signup.
          Changes apply to future signups and completions only; amounts already credited stay unchanged.
        </p>
        {referralUpdatedAt || signupBonusUpdatedAt ? (
          <p className="mt-2 text-xs text-slate-500">
            {referralUpdatedAt
              ? `Referrer reward saved: ${new Date(referralUpdatedAt).toLocaleString()}`
              : null}
            {referralUpdatedAt && signupBonusUpdatedAt ? ' · ' : null}
            {signupBonusUpdatedAt
              ? `Friend bonus saved: ${new Date(signupBonusUpdatedAt).toLocaleString()}`
              : null}
          </p>
        ) : null}

        <form onSubmit={onSaveReferral} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="admin-referral-amount">
              You earn when friend completes first session (₹)
            </label>
            <input
              id="admin-referral-amount"
              type="number"
              min={1}
              max={10000}
              step={1}
              value={referralRewardAmount}
              onChange={(e) => setReferralRewardAmount(e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="admin-signup-bonus">
              Friend gets on signup with your code (₹)
            </label>
            <input
              id="admin-signup-bonus"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={referralSignupBonusAmount}
              onChange={(e) => setReferralSignupBonusAmount(e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="mt-1 text-xs text-slate-500">Set to 0 to disable the friend signup wallet credit.</p>
          </div>
          <Button type="submit" loading={savingReferral} disabled={savingReferral}>
            Save referral settings
          </Button>
        </form>
      </Card>
    </div>
  )
}
