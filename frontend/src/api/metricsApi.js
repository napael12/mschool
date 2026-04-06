import api from './axiosInstance'

export const getSummary = () => api.get('/metrics/summary').then((r) => r.data)

export const getTeacherMetrics = () => api.get('/metrics/teachers').then((r) => r.data)
