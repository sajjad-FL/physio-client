import toast from 'react-hot-toast'
import {
  SUPPORT_WHATSAPP_MESSAGE,
  SUPPORT_WHATSAPP_NUMBER,
} from '../constants/supportContact'

function normalizeIndiaPhone(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned
  return '91' + cleaned.slice(-10)
}

export function openWhatsApp(phone) {
  const number = normalizeIndiaPhone(phone)
  if (!number || number.length < 12) {
    toast.error('No valid phone number')
    return
  }
  window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer')
}

export function openSupportWhatsApp(message = SUPPORT_WHATSAPP_MESSAGE) {
  const text = encodeURIComponent(message)
  window.open(
    `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function callPhone(phone) {
  const number = normalizeIndiaPhone(phone)
  if (!number || number.length < 12) {
    toast.error('No valid phone number')
    return
  }
  window.location.href = `tel:+${number}`
}
