import api from './axiosInstance'

export const listLessons = () => api.get('/lessons').then((r) => r.data)

export const getLesson = (id) => api.get(`/lessons/${id}`).then((r) => r.data)

export const createLesson = (data) => api.post('/lessons', data).then((r) => r.data)

export const updateLesson = (id, data) => api.put(`/lessons/${id}`, data).then((r) => r.data)

export const deleteLesson = (id) => api.delete(`/lessons/${id}`).then((r) => r.data)

export const addComment = (id, text) =>
  api.post(`/lessons/${id}/comments`, { text }).then((r) => r.data)

export const applyLessonCredits = (id) =>
  api.post(`/lessons/${id}/apply-credits`).then((r) => r.data)

export const cancelLesson = (id, sendEmail = false, refundCredits = false) =>
  api.post(`/lessons/${id}/cancel`, { send_email: sendEmail, refund_credits: refundCredits }).then((r) => r.data)

export const rescheduleLesson = (id, lessonDt, sendEmail = false) =>
  api.post(`/lessons/${id}/reschedule`, { lesson_dt: lessonDt, send_email: sendEmail }).then((r) => r.data)
