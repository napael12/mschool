import api from './axiosInstance'

export const getCredits = () => api.get('/credits').then((r) => r.data)

export const adjustCredits = (data) => api.post('/credits', data).then((r) => r.data)
