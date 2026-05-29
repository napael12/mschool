import api from './axiosInstance'

export const listParticipants = () => api.get('/users/participants').then((r) => r.data)

export const listUsers = (profile) =>
  api.get('/users', { params: profile ? { profile } : {} }).then((r) => r.data)

export const getUser = (id) => api.get(`/users/${id}`).then((r) => r.data)

export const createUser = (data) => api.post('/users', data).then((r) => r.data)

export const updateUser = (id, data) => api.put(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id) => api.delete(`/users/${id}`).then((r) => r.data)

export const addStudent = (data) => api.post('/users/add-student', data).then((r) => r.data)
export const inviteUser = (data) => api.post('/users/invite', data).then((r) => r.data)

export const adminSendPasswordReset = (id) =>
  api.post(`/users/${id}/send-reset`).then((r) => r.data)

export const setUserPassword = (id, password) =>
  api.put(`/users/${id}/password`, { password }).then((r) => r.data)
