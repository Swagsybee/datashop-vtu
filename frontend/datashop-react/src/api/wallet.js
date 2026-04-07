import api from './axios'
export const walletApi = {
  balance:       ()  => api.get('/wallet/balance/'),
  initiateFund:  (d) => api.post('/wallet/fund/initiate/', d),
  verifyFund:    (r) => api.get(`/wallet/fund/verify/${r}/`),
  fundHistory:   ()  => api.get('/wallet/fund/history/'),
  history:       ()  => api.get('/wallet/history/'),
}
