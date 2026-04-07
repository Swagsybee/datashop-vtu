import api from './axios'
export const adminApi = {
  stats:        ()  => api.get('/admin/stats/'),
  activity:     ()  => api.get('/admin/activity/'),
  walletStats:  ()  => api.get('/admin/wallet-stats/'),
  users:        (p) => api.get('/admin/users/', { params: p }),
  userDetail:   (id) => api.get(`/admin/users/${id}/`),
  createUser:   (d) => api.post('/admin/users/create/', d),
  fundUser:     (d) => api.post('/admin/users/fund/', d),
  suspendUser:  (d) => api.post('/admin/users/suspend/', d),
  activateUser: (id) => api.post(`/admin/users/${id}/activate/`),
  transactions: (p) => api.get('/admin/transactions/', { params: p }),
  refund:       (id) => api.post(`/admin/transactions/${id}/refund/`),
  toggleSvc:    (s) => api.post(`/admin/services/${s}/toggle/`),
  updateRate:   (d) => api.post('/admin/rates/update/', d),
}
