import api from './axiosInstance'

export const login = (email, password, rememberMe = false) =>
  api.post('/auth/login', { email, password, remember_me: rememberMe }).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)

export const updateProfile = (data) => api.put('/auth/profile', data).then((r) => r.data)

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token, new_password) =>
  api.post('/auth/reset-password', { token, new_password }).then((r) => r.data)
