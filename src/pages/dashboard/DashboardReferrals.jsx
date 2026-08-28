import { useMemo } from 'react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import {
  DEFAULT_REFERRAL_REWARD_AMOUNT,
  DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT,
  useReferralMyCode,
  useReferralStats,
} from '../../hooks/useReferral'

const REGISTER_BASE = 'https://app.physiokhom.com/register'

function rewardLabel(status) {
  if (status === 'credited') return { text: 'Credited', cls: 'bg-emerald-50 text-emerald-800' }
  if (status === 'pending') return { text: 'Pending', cls: 'bg-amber-50 text-amber-800' }
  return { text: 'Not yet', cls: 'bg-slate-100 text-slate-600' }
}

export default function DashboardReferrals() {
  const {
    referralCode,
    walletBalance,
    referralRewardAmount,
    referralSignupBonusAmount,
    loading: codeLoading,
    refresh: refreshCode,
  } = useReferralMyCode()
  const { referrals, loading: statsLoading, refresh: refreshStats } = useReferralStats()

  const earnAmount = referralRewardAmount || DEFAULT_REFERRAL_REWARD_AMOUNT
  const friendBonus =
    referralSignupBonusAmount ?? DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT

  const shareUrl = useMemo(
    () => (referralCode ? `${REGISTER_BASE}?ref=${encodeURIComponent(referralCode)}` : ''),
    [referralCode],
  )

  async function copyCode() {
    if (!referralCode) return
    try {
      await navigator.clipboard.writeText(referralCode)
      toast.success('Referral code copied')
    } catch {
      toast.error('Could not copy code')
    }
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Invite link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  async function shareInvite() {
    if (!referralCode) return
    const friendPart =
      friendBonus > 0
        ? `They get ₹${friendBonus} on signup. `
        : ''
    const message = `Join PhysioKhom! Use my code ${referralCode} to get started. ${friendPart}You'll earn ₹${earnAmount} when they complete their first session. ${shareUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PhysioKhom', text: message, url: shareUrl })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    await copyLink()
  }

  const loading = codeLoading || statsLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-page-title">Refer &amp; Earn</h1>
        <p className="mt-1 type-caption text-slate-500">
          Share your code.
          {friendBonus > 0 ? (
            <>
              {' '}
              Friends get ₹{friendBonus} wallet credit when they sign up.
            </>
          ) : null}{' '}
          You earn ₹{earnAmount} when they complete their first session.
        </p>
      </div>

      <Card className="p-6">
        {codeLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your referral code</p>
            <p className="type-stat mt-2 font-mono tracking-widest text-teal-700">{referralCode || '—'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {friendBonus > 0 ? (
                <p className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-900 ring-1 ring-violet-200/80">
                  Friends get ₹{friendBonus} on signup
                </p>
              ) : null}
              <p className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900 ring-1 ring-amber-200/80">
                You earn ₹{earnAmount} per friend
              </p>
              <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                Wallet balance: ₹{walletBalance.toFixed(0)}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copyCode} disabled={!referralCode}>
                Copy code
              </Button>
              <Button type="button" variant="primary" onClick={shareInvite} disabled={!referralCode}>
                Share invite
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Friends you referred</h2>
          <button
            type="button"
            className="text-sm font-medium text-teal-700 hover:underline"
            onClick={() => {
              refreshCode()
              refreshStats()
            }}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : referrals.length === 0 ? (
          <p className="text-sm text-slate-500">No referrals yet. Share your code to get started.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {referrals.map((r) => {
              const badge = rewardLabel(r.rewardStatus)
              return (
                <li key={String(r.userId)} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.phone}</p>
                    {r.rewardStatus === 'credited' && r.amount != null ? (
                      <p className="mt-0.5 text-xs text-emerald-700">+₹{r.amount} credited</p>
                    ) : null}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                    {badge.text}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
