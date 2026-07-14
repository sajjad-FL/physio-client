import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/formToast'
import { resolveFileUrl } from '../../utils/serverOrigin'
import { formatInr } from '../../utils/shopDisplay'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import Pagination from '../../components/Pagination'
import FieldLabel from '../../components/ui/FieldLabel'
import { prepareUploadFile } from '../../utils/compressImage.js'

function emptyForm() {
  return {
    name: '',
    description: '',
    price: '',
    stock: '0',
    isActive: true,
    imageFiles: [],
    existingImages: [],
    newPreviews: [],
  }
}

export default function AdminProductsPage() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [rowBusy, setRowBusy] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/products', { params: { page, limit: 20 } })
      setList(data?.data || [])
      setTotalPages(data?.totalPages || 1)
    } catch (err) {
      toastApiError(err, 'Could not load products')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm())
    setFieldErrors({})
    setShowForm(true)
  }

  function openEdit(product) {
    setEditId(product._id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? 0),
      isActive: product.isActive !== false,
      imageFiles: [],
      existingImages: product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
      newPreviews: [],
    })
    setFieldErrors({})
    setShowForm(true)
  }

  function closeForm() {
    form.newPreviews.forEach((url) => URL.revokeObjectURL(url))
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm())
    setFieldErrors({})
  }

  async function onImagesPick(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    try {
      if (files.some((f) => f.size > 400 * 1024)) toast.loading('Optimizing images…', { id: 'img-compress' })
      const prepared = []
      for (const file of files) {
        prepared.push(await prepareUploadFile(file, 'product'))
      }
      toast.dismiss('img-compress')
      setForm((prev) => ({
        ...prev,
        imageFiles: [...prev.imageFiles, ...prepared],
        newPreviews: [...prev.newPreviews, ...prepared.map((f) => URL.createObjectURL(f))],
      }))
      setFieldErrors((prev) => ({ ...prev, images: '' }))
    } catch (err) {
      toast.dismiss('img-compress')
      toast.error(err?.message || 'Could not optimize images')
    }
  }

  async function removeExistingImage(index) {
    if (!editId) return
    setSaving(true)
    try {
      const { data } = await api.delete(`/admin/products/${editId}/images/${index}`)
      setForm((prev) => ({
        ...prev,
        existingImages: data?.imageUrls || [],
      }))
      toast.success('Image removed')
      await load()
    } catch (err) {
      toastApiError(err, 'Could not remove image')
    } finally {
      setSaving(false)
    }
  }

  async function saveProduct(e) {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('description', form.description.trim())
      fd.append('price', form.price)
      fd.append('stock', form.stock)
      fd.append('isActive', form.isActive ? 'true' : 'false')
      form.imageFiles.forEach((file) => fd.append('images', file))

      if (editId) {
        fd.append('keepImageUrls', JSON.stringify(form.existingImages))
        await api.patch(`/admin/products/${editId}`, fd)
        toast.success('Product updated')
      } else {
        if (!form.imageFiles.length) {
          setFieldErrors({ images: 'At least one product photo is required' })
          setSaving(false)
          return
        }
        await api.post('/admin/products', fd)
        toast.success('Product added')
      }
      closeForm()
      await load()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      toastApiError(err, data?.message || 'Could not save product')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product) {
    const id = product._id
    setRowBusy((b) => ({ ...b, [id]: true }))
    try {
      const fd = new FormData()
      fd.append('name', product.name)
      fd.append('description', product.description || '')
      fd.append('price', String(product.price))
      fd.append('stock', String(product.stock))
      fd.append('isActive', product.isActive ? 'false' : 'true')
      fd.append('keepImageUrls', JSON.stringify(product.imageUrls || []))
      await api.patch(`/admin/products/${id}`, fd)
      toast.success(product.isActive ? 'Product hidden' : 'Product visible')
      await load()
    } catch (err) {
      toastApiError(err, 'Could not update product')
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }))
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return
    const id = product._id
    setRowBusy((b) => ({ ...b, [id]: true }))
    try {
      await api.delete(`/admin/products/${id}`)
      toast.success('Product deleted')
      await load()
    } catch (err) {
      toastApiError(err, 'Could not delete product')
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }))
    }
  }

  async function moveProduct(index, direction) {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    const items = next.map((p, i) => ({ id: p._id, sortOrder: i }))
    setRowBusy((b) => ({ ...b, reorder: true }))
    try {
      const { data } = await api.patch('/admin/products/reorder', { items })
      setList(data?.data || next)
      toast.success('Order updated')
    } catch (err) {
      toastApiError(err, 'Could not reorder')
      await load()
    } finally {
      setRowBusy((b) => ({ ...b, reorder: false }))
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Shop products"
        subtitle="Manage products with price, stock, and photos. Patients can add to cart and pay cash on delivery."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Shop products' }]}
        actions={
          <div className="flex gap-2">
            <Link to="/admin/shop/orders" className="rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-border-subtle hover:bg-slate-50">
              Shop orders
            </Link>
            <button type="button" onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
              Add product
            </button>
          </div>
        }
      />

      {showForm ? (
        <form onSubmit={saveProduct} className="mb-6 rounded-2xl border border-border-subtle bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">{editId ? 'Edit product' : 'Add product'}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required className="mb-1 block text-xs font-medium text-ink-muted">
                Product name
              </FieldLabel>
              <input className="h-11 w-full rounded-lg border border-border-subtle px-3 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel className="mb-1 block text-xs font-medium text-ink-muted">Description</FieldLabel>
              <textarea className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <FieldLabel required className="mb-1 block text-xs font-medium text-ink-muted">
                Price (₹)
              </FieldLabel>
              <input type="number" min="0" step="1" className="h-11 w-full rounded-lg border border-border-subtle px-3 text-sm" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              {fieldErrors.price ? <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p> : null}
            </div>
            <div>
              <FieldLabel required className="mb-1 block text-xs font-medium text-ink-muted">
                Stock
              </FieldLabel>
              <input type="number" min="0" step="1" className="h-11 w-full rounded-lg border border-border-subtle px-3 text-sm" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required />
              {fieldErrors.stock ? <p className="mt-1 text-xs text-red-600">{fieldErrors.stock}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-muted">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Visible in shop
              </label>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel required className="mb-1 block text-xs font-medium text-ink-muted">
                Photos (up to 6)
              </FieldLabel>
              <div className="flex flex-wrap gap-2">
                {form.existingImages.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={resolveFileUrl(url)} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-border-subtle" />
                    {editId ? (
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
                {form.newPreviews.map((url) => (
                  <img key={url} src={url} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-border-subtle" />
                ))}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImagesPick} className="mt-2" />
              {fieldErrors.images ? <p className="mt-1 text-xs text-red-600">{fieldErrors.images}</p> : null}
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving…' : editId ? 'Save changes' : 'Add product'}
            </button>
            <button type="button" onClick={closeForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-muted hover:bg-slate-100">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-muted">No products yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-slate-50 text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p, index) => {
                  const img = p.imageUrls?.[0] || p.imageUrl
                  return (
                    <tr key={p._id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button type="button" disabled={index === 0 || rowBusy.reorder} onClick={() => moveProduct(index, -1)} className="rounded-lg px-2 py-1 text-xs ring-1 ring-border-subtle disabled:opacity-40">↑</button>
                          <button type="button" disabled={index === list.length - 1 || rowBusy.reorder} onClick={() => moveProduct(index, 1)} className="rounded-lg px-2 py-1 text-xs ring-1 ring-border-subtle disabled:opacity-40">↓</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{img ? <img src={resolveFileUrl(img)} alt="" className="h-12 w-12 rounded-lg object-cover" /> : '—'}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">{formatInr(p.price)}</td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={rowBusy[p._id]} onClick={() => openEdit(p)} className="text-xs font-semibold text-teal-700 hover:underline">Edit</button>
                          <button type="button" disabled={rowBusy[p._id]} onClick={() => toggleActive(p)} className="text-xs font-semibold text-ink-muted hover:underline">{p.isActive ? 'Hide' : 'Show'}</button>
                          <button type="button" disabled={rowBusy[p._id]} onClick={() => deleteProduct(p)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}
    </div>
  )
}
