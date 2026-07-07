import axios from 'axios'
import { getToken } from '../auth/session'

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
