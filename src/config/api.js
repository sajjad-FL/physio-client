import axios from 'axios'
import { getToken, getRoles } from '../auth/session'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({ baseURL })

const adminKey = import.meta.env.VITE_ADMIN_API_KEY || ''

function useAdminAuth(config) {
  const url = config.url || ''
  const roles = getRoles()
  const jwtIsAdmin = roles.includes('admin') && getToken()

  if (url.startsWith('/physios/nearby')) {
    return false
  }

  const method = (config.method || 'get').toLowerCase()
  const path = url.split('?')[0]

  // Physio JWT-only: pending check + create request (not admin key)
  if (path.startsWith('/withdraw/pending') || (path === '/withdraw' && method === 'post')) {
    return false
  }

  const isWithdrawAdminUrl =
    (path === '/withdraw' && method === 'get') || (method === 'patch' && /^\/withdraw\/[^/]+$/.test(path))

  const isAdminUrl =
    url.startsWith('/admin') ||
    isWithdrawAdminUrl ||
    (url === '/payment/release' && method === 'post') ||
    (url === '/bookings' && method === 'get') ||
    (Boolean(url.match(/^\/bookings\/[^/]+$/)) && method === 'patch') ||
    (Boolean(url.match(/^\/bookings\/[^/]+\/verify-payment$/)) && method === 'patch') ||
    (Boolean(url.match(/^\/bookings\/[^/]+\/reject-payment$/)) && method === 'patch') ||
    ((url === '/physios' || url.startsWith('/physios?')) && (method === 'get' || method === 'post'))

  if (isAdminUrl) {
    if (jwtIsAdmin) {
      return false
    }
    if (adminKey) {
      config.headers.Authorization = 'Bearer ' + adminKey
      return true
    }
  }

  return false
}

api.interceptors.request.use((config) => {
  if (useAdminAuth(config)) {
    return config
  }
  const token = getToken()
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})
