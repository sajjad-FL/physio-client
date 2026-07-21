import axios from 'axios'
import { clearToken, getToken } from '../auth/session'

function normalizeApiBase(raw) {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '')
  return trimmed || 'http://localhost:5001/api'
}

const baseURL = normalizeApiBase(import.meta.env.VITE_API_URL)

export const api = axios.create({ baseURL })

// Admin endpoints authenticate with the logged-in admin's JWT (role resolved
// server-side from the DB). There is no client-side admin key: the app router
// gates /admin on an admin JWT, and the server's requireAdmin verifies it.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

let clearingUnauthorizedSession = false

function isCredentialAuthRequest(config) {
  const url = String(config?.url || '')
  // Relative paths on this client (baseURL already includes /api)
  return /\/auth\/(login|register|register-physio|signup-otp|send-otp|forgot-password|reset-password|debug-login-otp)/i.test(
    url,
  )
}

function redirectToLogin() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname || ''
  if (path.startsWith('/login') || path.startsWith('/register')) return
  window.location.replace('/login')
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (
      status === 401 &&
      getToken() &&
      !clearingUnauthorizedSession &&
      !isCredentialAuthRequest(error.config)
    ) {
      clearingUnauthorizedSession = true
      try {
        clearToken()
        redirectToLogin()
      } finally {
        clearingUnauthorizedSession = false
      }
    }
    return Promise.reject(error)
  },
)
