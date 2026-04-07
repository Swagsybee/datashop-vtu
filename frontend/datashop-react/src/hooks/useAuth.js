import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import { getApiError } from '../utils/helpers'

export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: (res) => {
      const { user, tokens } = res.data
      setAuth(user, tokens.access, tokens.refresh)
      toast.success(`Welcome back, ${user.first_name}! 👋`)
      navigate(user.role === 'superadmin' || user.role === 'admin' ? '/admin' : '/dashboard')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export const useRegister = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: (res) => {
      const { user, tokens } = res.data
      setAuth(user, tokens.access, tokens.refresh)
      toast.success(`Account created! Welcome, ${user.first_name}! 🎉`)
      navigate('/dashboard')
    },
    onError: (err) => toast.error(getApiError(err)),
  })
}

export const useLogout = () => {
  const { logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()
  return useCallback(async () => {
    try { await authApi.logout({ refresh: refreshToken }) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully.')
  }, [logout, navigate, refreshToken])
}

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => authApi.dashboard().then((r) => r.data) })

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => authApi.notifications().then((r) => r.data) })
