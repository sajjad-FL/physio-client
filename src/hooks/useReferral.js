import { useCallback, useEffect, useState } from 'react'
import { api } from '../config/api'

export const DEFAULT_REFERRAL_REWARD_AMOUNT = 300
export const DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT = 100

export function useReferralMyCode(enabled = true) {
  const [referralCode, setReferralCode] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [referralRewardAmount, setReferralRewardAmount] = useState(DEFAULT_REFERRAL_REWARD_AMOUNT)
  const [referralSignupBonusAmount, setReferralSignupBonusAmount] = useState(
    DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT,
  )
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const res = await api.get('/referral/my-code')
      setReferralCode(res.data?.referralCode || '')
      setWalletBalance(Number(res.data?.walletBalance) || 0)
      const amt = Number(res.data?.referralRewardAmount)
      setReferralRewardAmount(
        Number.isFinite(amt) && amt > 0 ? Math.round(amt) : DEFAULT_REFERRAL_REWARD_AMOUNT,
      )
      const bonus = Number(res.data?.referralSignupBonusAmount)
      setReferralSignupBonusAmount(
        Number.isFinite(bonus) && bonus >= 0 ? Math.round(bonus) : DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT,
      )
    } catch {
      setReferralCode('')
      setWalletBalance(0)
      setReferralRewardAmount(DEFAULT_REFERRAL_REWARD_AMOUNT)
      setReferralSignupBonusAmount(DEFAULT_REFERRAL_SIGNUP_BONUS_AMOUNT)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    referralCode,
    walletBalance,
    referralRewardAmount,
    referralSignupBonusAmount,
    loading,
    refresh,
  }
}

export function useReferralStats(enabled = true) {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const res = await api.get('/referral/stats')
      setReferrals(Array.isArray(res.data?.referrals) ? res.data.referrals : [])
    } catch {
      setReferrals([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { referrals, loading, refresh }
}
