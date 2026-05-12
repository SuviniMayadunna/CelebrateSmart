import React from "react"
import { useState } from 'react';
import { AppScreen } from '@/App';
import { Mail, Lock, ArrowLeft, User, Shield } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'customer' | 'admin') => void;
  onNavigate: (screen: AppScreen) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginScreen({ onLogin, onNavigate, isLoading = false, error }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password, role);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden flex items-center justify-center px-4'>
      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl'></div>
      </div>

      <div className='relative z-10 max-w-md w-full'>
        {/* Back button */}
        <button
          onClick={() => onNavigate('welcome')}
          className='flex items-center space-x-2 text-white mb-6 hover:translate-x-1 transition-transform'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='font-medium'>Back to Home</span>
        </button>

        {/* Login Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8 space-y-6'>
          <div className='text-center space-y-2'>
            <h1 className='text-3xl font-black text-gray-800'>Welcome Back!</h1>
            <p className='text-gray-600'>Sign in to continue planning</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Email Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Email Address</label>
              <div className='relative'>
                <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white'
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Password</label>
              <div className='relative'>
                <Lock className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-3'>Login As</label>
              <div className='grid grid-cols-2 gap-3'>
                {[
                  { value: 'customer' as const, icon: User, label: 'Customer' },
                  { value: 'admin' as const, icon: Shield, label: 'Admin' }
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.value;
                  return (
                    <label 
                      key={r.value} 
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <input
                        type='radio'
                        checked={isSelected}
                        onChange={() => setRole(r.value)}
                        className='sr-only'
                      />
                      <div className='flex flex-col items-center space-y-2'>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
                          {r.label}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* API Error */}
            {error && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-600 font-medium'>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg text-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2'
            >
              {isLoading && (
                <span className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
              )}
              {isLoading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          {/* Registration Link */}
          <div className='text-center pt-4 border-t border-gray-200'>
            <p className='text-gray-600'>
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className='text-primary font-bold hover:text-primary/90 transition-colors'
              >
                Create Account
              </button>
            </p>
          </div>

          
        </div>
      </div>
    </div>
  );
}
