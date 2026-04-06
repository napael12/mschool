import api from './axiosInstance'

export const listLibrary = () => api.get('/library').then((r) => r.data)

export const createLibraryItem = (data) => api.post('/library', data).then((r) => r.data)

export const updateLibraryItem = (id, data) => api.put(`/library/${id}`, data).then((r) => r.data)

export const deleteLibraryItem = (id) => api.delete(`/library/${id}`).then((r) => r.data)
