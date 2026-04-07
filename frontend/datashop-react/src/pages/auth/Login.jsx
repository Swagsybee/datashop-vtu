import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useLogin } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { mutate, isPending } = useLogin()
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl slide-up">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600
                        flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
          D
        </div>
        <span className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Data</span>shop
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <div className="flex-1 bg-white rounded-lg py-2 text-center text-sm font-bold text-orange-500 shadow-sm">Login</div>
        <Link to="/register" className="flex-1 py-2 text-center text-sm font-semibold text-gray-500 hover:text-gray-700">Sign Up</Link>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input className={`input ${errors.email ? 'input-error' : ''}`}
            type="email" placeholder="email@example.com"
            {...register('email', { required: 'Email is required' })} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              type={showPass ? 'text' : 'password'} placeholder="Enter password"
              {...register('password', { required: 'Password is required' })} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div className="text-right">
          <button type="button" className="text-xs text-orange-500 font-semibold hover:text-orange-600">
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? <Spinner /> : 'Login to Datashop'}
        </button>
      </form>

      <div className="mt-5 p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
        Demo: <span className="font-bold text-gray-700">demo@datashop.ng</span> / <span className="font-bold text-gray-700">demo1234</span>
      </div>
    </div>
  )
}
