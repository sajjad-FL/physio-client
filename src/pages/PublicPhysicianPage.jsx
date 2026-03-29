import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../config/api'
import { assetUrl } from '../utils/assetUrl'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { StarRatingDisplay } from '../components/reviews/StarRating'
import Pagination from '../components/Pagination'
import toast from 'react-hot-toast'

export default function PublicPhysicianPage() {
  const { id } = useParams()
  const [physio, setPhysio] = useState(null)
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPhysio = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/physios/${id}`)
      setPhysio(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load profile')
      setPhysio(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadReviews = useCallback(async () => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const res = await api.get(`/physios/${id}/reviews`, { params: { page, limit: 8 } })
      setReviews(res.data?.data || [])
      setTotalPages(res.data?.totalPages || 1)
    } catch {
      toast.error('Could not load reviews')
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [id, page])

  useEffect(() => {
    loadPhysio()
  }, [loadPhysio])

  useEffect(() => {
    if (physio) loadReviews()
  }, [physio, loadReviews])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (error || !physio) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-medium text-gray-900">{error || 'Not found'}</p>
        <Link to="/book" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800">
          ← Back to booking
        </Link>
      </div>
    )
  }

  const p = physio
  const avg = Number(p.avgRating) || 0
  const total = Number(p.totalReviews) || 0
  const avatarSrc = assetUrl(p.avatar)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 pb-16">
      <header className="border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
          <Link to="/book" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            ← Book a session
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Card hover={false} className="overflow-hidden border border-gray-100 p-0 shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-gray-100">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-400">
                  {(p.name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{p.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{p.specialization}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <StarRatingDisplay value={avg} size="md" />
                <span className="text-sm font-medium text-gray-700">
                  {total > 0 ? `${avg.toFixed(1)} · ${total} review${total === 1 ? '' : 's'}` : 'No reviews yet'}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Experience</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{p.experience ?? 0} yrs</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fee</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">₹{p.pricePerSession ?? 0}/session</dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Service</dt>
                  <dd className="mt-0.5 font-medium capitalize text-gray-900">{p.serviceType || '—'}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-gray-600">{p.location}</p>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
          <p className="mt-0.5 text-sm text-gray-500">Feedback from verified patients after completed sessions.</p>

          {reviewsLoading ? (
            <div className="mt-6 h-32 animate-pulse rounded-2xl bg-white ring-1 ring-gray-100" />
          ) : reviews.length === 0 ? (
            <Card hover={false} className="mt-4 border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
              No reviews yet.
            </Card>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r._id}>
                  <Card hover={false} className="border border-gray-100 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{r.user?.name || 'Patient'}</span>
                      <StarRatingDisplay value={r.rating} size="sm" />
                    </div>
                    {r.comment ? <p className="mt-3 text-sm leading-relaxed text-gray-700">{r.comment}</p> : null}
                    <p className="mt-2 text-xs text-gray-400">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Link to="/book">
            <Button type="button" className="rounded-xl">
              Book with {p.name?.split(' ')[0] || 'this physio'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
