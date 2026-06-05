import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../config/api'
import AdminPageHeader, { AdminLink } from '../../components/admin/AdminPageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Pagination from '../../components/Pagination'
import { toastApiError } from '../../utils/formToast'

const PAGE_SIZE = 20

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-900 ring-amber-200',
    red: 'bg-rose-50 text-rose-900 ring-rose-200',
    blue: 'bg-sky-50 text-sky-900 ring-sky-200',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  )
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={[
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25',
        className,
      ].join(' ')}
    >
      {children}
    </select>
  )
}

export default function AdminDirectoryPage() {
  const [searchParams] = useSearchParams()

  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [userLinked, setUserLinked] = useState('')
  const [appliedUsers, setAppliedUsers] = useState({ search: '', role: '', linkedPhysio: '' })
  const [userPage, setUserPage] = useState(1)
  const [usersPayload, setUsersPayload] = useState(null)
  const [usersLoading, setUsersLoading] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState('')

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const { data } = await api.get('/admin/users', {
        params: {
          page: userPage,
          limit: PAGE_SIZE,
          search: appliedUsers.search || undefined,
          role: appliedUsers.role || undefined,
          linkedPhysio: appliedUsers.linkedPhysio || undefined,
        },
      })
      setUsersPayload(data)
    } catch (err) {
      setUsersPayload(null)
      toastApiError(err, 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [userPage, appliedUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const users = usersPayload?.data || []

  const userFiltersActive = useMemo(
    () => Object.values(appliedUsers).some(Boolean),
    [appliedUsers],
  )

  function applyUserFilters() {
    setAppliedUsers({
      search: userSearch.trim(),
      role: userRole,
      linkedPhysio: userLinked,
    })
    setUserPage(1)
  }

  function resetUserFilters() {
    setUserSearch('')
    setUserRole('')
    setUserLinked('')
    setAppliedUsers({ search: '', role: '', linkedPhysio: '' })
    setUserPage(1)
  }

  async function deleteUser(user) {
    const ok = window.confirm(`Delete this user account?\n\n${user.name || user.phone || user._id}`)
    if (!ok) return
    setDeletingUserId(user._id)
    try {
      await api.delete(`/admin/users/${user._id}`)
      toast.success('User deleted')
      await loadUsers()
    } catch (err) {
      toastApiError(err, 'Delete failed')
    } finally {
      setDeletingUserId('')
    }
  }

  if (searchParams.get('tab') === 'physios') {
    return <Navigate to="/admin/physios" replace />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        subtitle="Browse registered patient and physio accounts. To manage physio profiles, verification, or payouts, use the links below."
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Users' }]}
        actions={
          <>
            <AdminLink to="/admin/physios">Physiotherapists →</AdminLink>
            <AdminLink to="/admin/physios?tab=queue">Verification queue →</AdminLink>
          </>
        }
      />

      <Card hover={false} className="p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_180px_auto] lg:items-end">
          <div>
            <label className="text-xs font-medium text-slate-500">Search</label>
            <Input
              className="mt-1"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyUserFilters()}
              placeholder="Name, phone, email, location"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Role</label>
            <Select className="mt-1" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="physio">Physio</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Physio link</label>
            <Select className="mt-1" value={userLinked} onChange={(e) => setUserLinked(e.target.value)}>
              <option value="">All</option>
              <option value="true">Linked to physio profile</option>
              <option value="false">Not linked</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={applyUserFilters}>Apply</Button>
            <Button variant="ghost" onClick={resetUserFilters}>Reset</Button>
          </div>
        </div>
      </Card>

      <Card hover={false} className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold text-slate-900">
            {usersPayload?.total ?? 0} user{usersPayload?.total === 1 ? '' : 's'}
            {userFiltersActive ? ' (filtered)' : ''}
          </p>
        </div>
        {usersLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No users match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Profile</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name || 'No name'}</div>
                      <div className="text-xs text-slate-500">{u.email || u._id}</div>
                      {u.isLinkedPhysio && (
                        <Link to="/admin/physios" className="mt-1 inline-block text-xs font-medium text-teal-700 hover:underline">
                          Has physio profile
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === 'admin' ? 'blue' : u.role === 'physio' ? 'green' : 'slate'}>
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.location || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isProfileComplete ? 'green' : 'amber'}>
                        {u.isProfileComplete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        className="px-3 py-1.5 text-xs text-rose-700"
                        disabled={deletingUserId === u._id || u.role === 'admin'}
                        onClick={() => deleteUser(u)}
                      >
                        {deletingUserId === u._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!usersLoading && users.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination page={userPage} totalPages={usersPayload?.totalPages || 1} onPageChange={setUserPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
