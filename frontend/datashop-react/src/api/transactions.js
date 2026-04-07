import api from './axios'
export const txApi = {
  list:         (p) => api.get('/transactions/', { params: p }),
  detail:       (id) => api.get(`/transactions/${id}/`),
  stats:        ()  => api.get('/transactions/stats/'),
  scheduled:    ()  => api.get('/transactions/scheduled/'),
  schedule:     (d) => api.post('/transactions/scheduled/', d),
  cancelSched:  (id) => api.delete(`/transactions/scheduled/${id}/cancel/`),
}
