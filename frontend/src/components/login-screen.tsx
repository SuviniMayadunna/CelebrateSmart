import React from 'react';
import { AppScreen } from '@/App';
import { Mail, Lock, ArrowLeft, User, Shield } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'customer' | 'admin') => void;
  onNavigate: (screen: AppScreen) => void;
  isLoading?: boolean;
  error?: string | null;
}

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['customer', 'admin']),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen({ onLogin, onNavigate, isLoading = false, error }: LoginScreenProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'customer',
    },
    mode: 'onTouched',
  });

  const submit = (values: LoginFormValues) => {
    onLogin(values.email, values.password, values.role);
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
          onClick={() => onNavigate('welcome')}
          className='mb-6 h-auto px-0 text-white hover:bg-white/10 hover:text-white'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='ml-2 font-medium'>Back to Home</span>
        </Button>

        {/* Login Card */}
        <Card className='rounded-3xl shadow-2xl border-0'>
          <CardHeader className='text-center space-y-2'>
            <CardTitle className='text-3xl font-black'>Welcome Back!</CardTitle>
            <CardDescription>Sign in to continue planning</CardDescription>
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login As</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className='grid grid-cols-2 gap-3'
                        >
                          {[
                            { value: 'customer' as const, icon: User, label: 'Customer' },
                            { value: 'admin' as const, icon: Shield, label: 'Admin' },
                          ].map((r) => {
                            const Icon = r.icon;
                            const isSelected = field.value === r.value;
                            return (
                              <label
                                key={r.value}
                                className={cn(
                                  'cursor-pointer rounded-xl p-4 border transition-all bg-background',
                                  isSelected
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-input hover:border-muted-foreground/40'
                                )}
                              >
                                <div className='flex items-center gap-3'>
                                  <RadioGroupItem value={r.value} className='mt-0.5' />
                                  <div className='flex items-center gap-2'>
                                    <Icon className={cn('size-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                                    <span className={cn('font-semibold text-sm', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                                      {r.label}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
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

          {/* Registration Link */}
          <div className='text-center pt-4 border-t border-border'>
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
        </Card>
      </div>
    </div>
  );
}
