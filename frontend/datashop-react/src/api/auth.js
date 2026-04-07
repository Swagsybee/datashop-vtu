import api from './axios'
export const authApi = {
  register:       (d) => api.post('/auth/register/', d),
  login:          (d) => api.post('/auth/login/', d),
  logout:         (d) => api.post('/auth/logout/', d),
  profile:        ()  => api.get('/auth/profile/'),
  updateProfile:  (d) => api.patch('/auth/profile/', d),
  changePassword: (d) => api.post('/auth/change-password/', d),
  setPin:         (d) => api.post('/auth/pin/set/', d),
  changePin:      (d) => api.post('/auth/pin/change/', d),
  dashboard:      ()  => api.get('/auth/dashboard/'),
  notifications:  ()  => api.get('/auth/notifications/'),
  markRead:       ()  => api.post('/auth/notifications/read/'),
}
