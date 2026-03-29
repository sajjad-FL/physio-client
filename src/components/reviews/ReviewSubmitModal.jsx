import { useState } from 'react'
import { api } from '../../config/api'
import toast from 'react-hot-toast'
import Button from '../ui/Button'
import { StarRatingInput } from './StarRating'

/**
 * @param {{ open: boolean, bookingId: string, physioName?: string, onClose: () => void, onSubmitted: () => void }} props
 */
export default function ReviewSubmitModal({ open, bookingId, physioName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    if (!bookingId) return
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        bookingId,
        rating,
        comment: comment.trim(),
      })
      toast.success('Thank you for your feedback')
      setComment('')
      setRating(5)
      onSubmitted()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-gray-900">Rate your session</h2>
        {physioName && <p className="mt-1 text-sm text-gray-500">How was your visit with {physioName}?</p>}
        <label className="mt-5 block text-sm font-medium text-gray-800">Your rating</label>
        <div className="mt-2">
          <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
        </div>
        <label htmlFor="rev-comment" className="mt-5 block text-sm font-medium text-gray-800">
          Comment (optional)
        </label>
        <textarea
          id="rev-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          placeholder="What went well? What could improve?"
        />
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit review'}
          </Button>
        </div>
      </form>
    </div>
  )
}
