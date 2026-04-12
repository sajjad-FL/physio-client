import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import { resolveFileUrl } from '../../utils/serverOrigin'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

export default function AdminPlatformSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    physioNdaTemplateUrl: '',
    physioNdaOriginalName: '',
    physioNdaUpdatedAt: null,
  })
  const [file, setFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/platform/settings')
      setSettings({
        physioNdaTemplateUrl: data.physioNdaTemplateUrl || '',
        physioNdaOriginalName: data.physioNdaOriginalName || '',
        physioNdaUpdatedAt: data.physioNdaUpdatedAt || null,
      })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load platform settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onSubmit(e) {
    e.preventDefault()
    if (!file) {
      toast.error('Choose a PDF or image file (max 2MB)')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('ndaTemplate', file)
      const { data } = await api.post('/admin/platform/physio-nda', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(data.message || 'NDA template updated')
      setFile(null)
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-slate-600">Loading platform settings…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Platform documents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload the NDA template that physiotherapists download, sign offline, and upload again during onboarding or
          registration.
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Physio NDA template</h2>
        {settings.physioNdaTemplateUrl ? (
          <p className="mt-2 text-sm text-slate-600">
            Current file:{' '}
            <a
              href={resolveFileUrl(settings.physioNdaTemplateUrl)}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-teal-700 underline"
            >
              {settings.physioNdaOriginalName || 'Download'}
            </a>
            {settings.physioNdaUpdatedAt ? (
              <span className="mt-1 block text-xs text-slate-500">
                Updated {new Date(settings.physioNdaUpdatedAt).toLocaleString()}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-900">
            No template uploaded. Physios are not asked for a signed NDA until you upload one here.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="admin-nda-file">
              Replace template (PDF or image, max 2MB)
            </label>
            <input
              id="admin-nda-file"
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button type="submit" loading={saving} disabled={saving}>
            Upload template
          </Button>
        </form>
      </Card>
    </div>
  )
}
