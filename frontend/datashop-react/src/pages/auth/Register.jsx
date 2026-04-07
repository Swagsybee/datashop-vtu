import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { useRegister } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const { mutate, isPending } = useRegister()
  const [showPass, setShowPass] = useState(false)

  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl slide-up">
      <div className="flex items-center justify-center gap-3 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600
                        flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
          D
        </div>
        <span className="text-2xl font-black tracking-tight">
          <span className="text-orange-500">Data</span>shop
        </span>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <Link to="/login" className="flex-1 py-2 text-center text-sm font-semibold text-gray-500 hover:text-gray-700">Login</Link>
        <div className="flex-1 bg-white rounded-lg py-2 text-center text-sm font-bold text-orange-500 shadow-sm">Sign Up</div>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First Name</label>
            <input className={`input ${errors.first_name ? 'input-error' : ''}`} placeholder="John"
              {...register('first_name', { required: 'Required' })} />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className={`input ${errors.last_name ? 'input-error' : ''}`} placeholder="Doe"
              {...register('last_name', { required: 'Required' })} />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Email Address</label>
          <input className={`input ${errors.email ? 'input-error' : ''}`} type="email" placeholder="email@example.com"
            {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input className={`input ${errors.phone ? 'input-error' : ''}`} type="tel" placeholder="08012345678" maxLength={11}
            {...register('phone', { required: 'Phone is required', minLength: { value: 11, message: 'Must be 11 digits' } })} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
              type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input className={`input ${errors.password2 ? 'input-error' : ''}`}
            type="password" placeholder="Repeat password"
            {...register('password2', {
              required: 'Please confirm password',
              validate: (v) => v === watch('password') || 'Passwords do not match'
            })} />
          {errors.password2 && <p className="text-xs text-red-500 mt-1">{errors.password2.message}</p>}
        </div>

        <div>
          <label className="label">Referral Code (Optional)</label>
          <input className="input" placeholder="e.g. DSH-ABC123"
            {...register('referral_code')} />
        </div>

        <button type="submit" disabled={isPending} className="btn-primary mt-1">
          {isPending ? <Spinner /> : 'Create Account'}
        </button>
        <p className="text-xs text-gray-400 text-center">
          By signing up, you agree to our Terms of Service.
        </p>
      </form>
    </div>
  )
}
