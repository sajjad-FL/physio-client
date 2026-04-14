import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { DEFAULT_QUALIFICATION_DECLARATION } from '../../constants/qualificationDeclaration'

export default function AdminPlatformSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [declarationText, setDeclarationText] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/platform/settings')
      setDeclarationText(data.qualificationDeclarationResolved || DEFAULT_QUALIFICATION_DECLARATION)
      setUpdatedAt(data.qualificationDeclarationUpdatedAt || null)
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

  if (loading) {
    return <p className="p-4 text-sm text-slate-600">Loading platform settings…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Platform documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Text shown to physiotherapists during registration and onboarding. They must check &quot;I agree&quot; before
          submitting. Leaving the saved text empty (restore default) uses the built-in NearbyPhysio template.
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Qualification declaration</h2>
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
    </div>
  )
}
