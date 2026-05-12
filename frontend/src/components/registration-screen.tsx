import React from "react"
import { useState } from 'react';
import { AppScreen } from '@/App';
import { Mail, Lock, ArrowLeft, User, Phone } from 'lucide-react';

interface RegistrationScreenProps {
  onRegister: (name: string, email: string, password: string, phone: string) => void;
  onNavigate: (screen: AppScreen) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RegistrationScreen({ onRegister, onNavigate, isLoading = false, error }: RegistrationScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (formData.name && formData.email && formData.password && formData.phone) {
      onRegister(formData.name, formData.email, formData.password, formData.phone);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden flex items-center justify-center px-4 py-8'>
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

        {/* Registration Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8 space-y-6'>
          <div className='text-center space-y-2'>
            <h1 className='text-3xl font-black text-gray-800'>Create Account</h1>
            <p className='text-gray-600'>Join us and start planning amazing events</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Name Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Full Name</label>
              <div className='relative'>
                <User className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  placeholder='John Doe'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white'
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Email Address</label>
              <div className='relative'>
                <Mail className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='you@example.com'
                  className='w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white'
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Phone Number</label>
              <div className='relative'>
                <Phone className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='tel'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='+1 234 567 8900'
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
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password Input */}
            <div>
              <label className='block text-sm font-bold text-gray-700 mb-2'>Confirm Password</label>
              <div className='relative'>
                <Lock className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='••••••••'
                  className='w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none transition-colors bg-gray-50 focus:bg-white'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground'
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Local validation error */}
            {(validationError || error) && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-600 font-medium'>{validationError || error}</p>
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
              {isLoading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className='text-center pt-4 border-t border-gray-200'>
            <p className='text-gray-600'>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className='text-primary font-bold hover:text-primary/90 transition-colors'
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
