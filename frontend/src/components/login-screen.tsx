import React from 'react';
import { AppScreen } from '@/App';
import { Mail, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authAPI } from '@/lib/api';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'customer' | 'admin') => void;
  onNavigate: (screen: AppScreen) => void;
  isLoading?: boolean;
  error?: string | null;
}

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen({ onLogin, onNavigate, isLoading = false, error }: LoginScreenProps) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showForgot, setShowForgot] = React.useState(false);
  const [forgotStep, setForgotStep] = React.useState<'idle' | 'sent' | 'reset-done'>('idle');
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [resetToken, setResetToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotError, setForgotError] = React.useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const submit = (values: LoginFormValues) => {
    onLogin(values.email, values.password, isAdmin ? 'admin' : 'customer');
  };

  const handleSendReset = async () => {
    setForgotError(null);
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotStep('sent');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError(null);
    setForgotLoading(true);
    try {
      await authAPI.resetPassword({ token: resetToken, newPassword });
      setForgotStep('reset-done');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgot(false);
    setForgotStep('idle');
    setForgotEmail('');
    setResetToken('');
    setNewPassword('');
    setForgotError(null);
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
        <Button
          type='button'
          variant='ghost'
          onClick={showForgot ? handleBackToLogin : () => onNavigate('welcome')}
          className='mb-6 h-auto px-0 text-white hover:bg-white/10 hover:text-white'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='ml-2 font-medium'>{showForgot ? 'Back to Login' : 'Back to Home'}</span>
        </Button>

        {/* Login Card */}
        <Card className='rounded-3xl shadow-2xl border-0'>
          {!showForgot ? (
            <>
              <CardHeader className='text-center space-y-2'>
                {isAdmin && (
                  <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full mx-auto'
                    style={{ background: 'hsl(155,42%,94%)', border: '1px solid hsl(155,35%,78%)' }}>
                    <ShieldCheck className='w-3.5 h-3.5' style={{ color: 'hsl(155,42%,25%)' }} />
                    <span className='text-xs font-bold' style={{ color: 'hsl(155,42%,25%)' }}>Admin Login</span>
                  </div>
                )}
                <CardTitle className='text-3xl font-black'>
                  {isAdmin ? 'Admin Sign In' : 'Welcome Back!'}
                </CardTitle>
                <CardDescription>
                  {isAdmin ? 'Sign in to access the admin panel' : 'Sign in to continue planning'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(submit)} className='space-y-5'>
                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <div className='relative'>
                            <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                            <FormControl>
                              <Input
                                type='email'
                                placeholder='you@example.com'
                                className='pl-9'
                                autoComplete='email'
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className='relative'>
                            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='••••••••'
                                className='pl-9 pr-16'
                                autoComplete='current-password'
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => setShowPassword((v) => !v)}
                              disabled={isLoading}
                              className='absolute right-1 top-1/2 -translate-y-1/2 h-8'
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </Button>
                          </div>
                          <FormMessage />
                          <div className='text-right'>
                            <Button
                              type='button'
                              variant='link'
                              className='px-0 h-auto text-xs text-muted-foreground'
                              onClick={() => setShowForgot(true)}
                            >
                              Forgot password?
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div className='rounded-lg border border-destructive/20 bg-destructive/10 p-3'>
                        <p className='text-sm text-destructive font-medium'>{error}</p>
                      </div>
                    )}

                    <Button
                      type='submit'
                      disabled={isLoading}
                      className='w-full h-11 text-base font-bold'
                    >
                      {isLoading && (
                        <span className='size-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      )}
                      {isLoading ? 'Signing In…' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </CardContent>

              {/* Registration / Admin toggle */}
              <div className='pt-4 border-t border-border space-y-2'>
                {!isAdmin && (
                  <div className='text-center'>
                    <p className='text-muted-foreground'>
                      Don't have an account?{' '}
                      <Button
                        type='button'
                        variant='link'
                        onClick={() => onNavigate('register')}
                        className='px-1 font-bold text-primary'
                      >
                        Create Account
                      </Button>
                    </p>
                  </div>
                )}
                <div className='text-center'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => { setIsAdmin(v => !v); form.reset(); }}
                    className='text-xs text-muted-foreground hover:text-foreground gap-1.5'
                  >
                    <ShieldCheck className='w-3.5 h-3.5' />
                    {isAdmin ? 'Switch to Customer Login' : 'Sign in as Admin'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <CardHeader className='text-center space-y-2'>
                <CardTitle className='text-3xl font-black'>Reset Password</CardTitle>
                <CardDescription>
                  {forgotStep === 'idle' && 'Enter your email to receive a reset link.'}
                  {forgotStep === 'sent' && 'Check your email for reset instructions.'}
                  {forgotStep === 'reset-done' && 'Your password has been changed.'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                {forgotStep === 'idle' && (
                  <>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                      <Input
                        type='email'
                        placeholder='you@example.com'
                        className='pl-9'
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotLoading}
                      />
                    </div>
                    {forgotError && (
                      <div className='rounded-lg border border-destructive/20 bg-destructive/10 p-3'>
                        <p className='text-sm text-destructive font-medium'>{forgotError}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleSendReset}
                      disabled={forgotLoading || !forgotEmail}
                      className='w-full h-11 text-base font-bold'
                    >
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </Button>
                  </>
                )}

                {forgotStep === 'sent' && (
                  <>
                    <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                      <p className='text-sm text-green-700 font-medium'>
                        Check your email for reset instructions.
                      </p>
                    </div>
                    <div className='space-y-3'>
                      <Input
                        type='text'
                        placeholder='Reset token from email'
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        disabled={forgotLoading}
                      />
                      <Input
                        type='password'
                        placeholder='New password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={forgotLoading}
                      />
                    </div>
                    {forgotError && (
                      <div className='rounded-lg border border-destructive/20 bg-destructive/10 p-3'>
                        <p className='text-sm text-destructive font-medium'>{forgotError}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleResetPassword}
                      disabled={forgotLoading || !resetToken || !newPassword}
                      className='w-full h-11 text-base font-bold'
                    >
                      {forgotLoading ? 'Resetting…' : 'Reset Password'}
                    </Button>
                  </>
                )}

                {forgotStep === 'reset-done' && (
                  <>
                    <div className='rounded-lg border border-green-200 bg-green-50 p-3'>
                      <p className='text-sm text-green-700 font-medium'>
                        Password changed! Please log in.
                      </p>
                    </div>
                    <Button
                      onClick={handleBackToLogin}
                      className='w-full h-11 text-base font-bold'
                    >
                      Back to Login
                    </Button>
                  </>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
