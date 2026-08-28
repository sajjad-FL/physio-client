import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function ConfirmDeleteUserModal({ open, user, busy, onClose, onConfirm }) {
  const label = user?.name || user?.phone || 'this user'

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      title="Delete this user?"
      description="This permanently removes their account. This cannot be undone."
      centered
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">{label}</p>
          {user?.phone ? <p className="mt-1 tabular-nums text-slate-600">{user.phone}</p> : null}
          {user?.role ? (
            <p className="mt-1 text-xs capitalize text-slate-500">Role: {user.role.replace('_', ' ')}</p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={busy} onClick={onConfirm}>
            Delete user
          </Button>
        </div>
      </div>
    </Modal>
  )
}
