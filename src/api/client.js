import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login'
      && error.config?.headers?.Authorization === `Bearer ${localStorage.getItem('token')}`) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('auth-session-ended'))
    }
    return Promise.reject(error)
  },
)

export default api