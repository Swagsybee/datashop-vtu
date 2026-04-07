import api from './axios'
export const servicesApi = {
  dataPlans:       (p) => api.get('/services/data/plans/', { params: p }),
  tvProviders:     ()  => api.get('/services/tv/providers/'),
  discos:          ()  => api.get('/services/electricity/discos/'),
  examProducts:    (p) => api.get('/services/exam/products/', { params: p }),
  status:          ()  => api.get('/services/status/'),
  verifyMeter:     (d) => api.post('/services/electricity/verify-meter/', d),
  verifySmartcard: (d) => api.post('/services/tv/verify-smartcard/', d),
  buyData:         (d) => api.post('/services/data/buy/', d),
  buyAirtime:      (d) => api.post('/services/airtime/buy/', d),
  buyElectricity:  (d) => api.post('/services/electricity/buy/', d),
  buyTV:           (d) => api.post('/services/tv/buy/', d),
  buyExam:         (d) => api.post('/services/exam/buy/', d),
}
