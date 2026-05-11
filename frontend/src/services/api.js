import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const register = (data) => api.post('/auth/register/', data)
export const login = (data) => api.post('/auth/login/', data)
export const getMe = () => api.get('/auth/me/')
export const updateMe = (data) => api.patch('/auth/me/', data)
export const getDatasets = (params) => api.get('/datasets/', { params })
export const getDataset = (id) => api.get(`/datasets/${id}/`)
export const createDataset = (data) => api.post('/datasets/create/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteDataset = (id) => api.delete(`/datasets/${id}/`)
export const downloadDataset = (id) => api.get(`/datasets/${id}/download/`, { responseType: 'blob' })
export const previewDataset = (id) => api.get(`/datasets/${id}/preview/`)
export const getMyDatasets = () => api.get('/datasets/mine/')
export const rateDataset = (id, score) => api.post(`/datasets/${id}/rate/`, { score })
export const getComments = (id) => api.get(`/datasets/${id}/comments/`)
export const addComment = (id, content) => api.post(`/datasets/${id}/comments/`, { content })
export const deleteComment = (id) => api.delete(`/comments/${id}/delete/`)

export default api
