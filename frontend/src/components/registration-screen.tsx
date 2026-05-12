import React from 'react';
import { AppScreen } from '@/App';
import { Mail, Lock, ArrowLeft, User, Phone } from 'lucide-react';
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

interface RegistrationScreenProps {
  onRegister: (name: string, email: string, password: string, phone: string) => void;
  onNavigate: (screen: AppScreen) => void;
  isLoading?: boolean;
  error?: string | null;
}

const registrationSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required'),
    email: z.string().trim().email('Please enter a valid email'),
    phone: z.string().trim().min(1, 'Phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationScreen({ onRegister, onNavigate, isLoading = false, error }: RegistrationScreenProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const submit = (values: RegistrationFormValues) => {
    onRegister(values.name, values.email, values.password, values.phone);
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
        <Button
          type='button'
          variant='ghost'
          onClick={() => onNavigate('welcome')}
          className='mb-6 h-auto px-0 text-white hover:bg-white/10 hover:text-white'
        >
          <ArrowLeft className='w-5 h-5' />
          <span className='ml-2 font-medium'>Back to Home</span>
        </Button>

        {/* Registration Card */}
        <Card className='rounded-3xl shadow-2xl border-0'>
          <CardHeader className='text-center space-y-2'>
            <CardTitle className='text-3xl font-black'>Create Account</CardTitle>
            <CardDescription>Join us and start planning amazing events</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className='space-y-5'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <div className='relative'>
                        <User className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                        <FormControl>
                          <Input
                            type='text'
                            placeholder='John Doe'
                            className='pl-9'
                            autoComplete='name'
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
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className='relative'>
                        <Phone className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                        <FormControl>
                          <Input
                            type='tel'
                            placeholder='+1 234 567 8900'
                            className='pl-9'
                            autoComplete='tel'
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
                            autoComplete='new-password'
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
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className='relative'>
                        <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='••••••••'
                            className='pl-9 pr-16'
                            autoComplete='new-password'
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          disabled={isLoading}
                          className='absolute right-1 top-1/2 -translate-y-1/2 h-8'
                        >
                          {showConfirmPassword ? 'Hide' : 'Show'}
                        </Button>
                      </div>
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
                  {isLoading ? 'Creating Account…' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>

          {/* Login Link */}
          <div className='text-center pt-4 border-t border-border'>
            <p className='text-muted-foreground'>
              Already have an account?{' '}
              <Button
                type='button'
                variant='link'
                onClick={() => onNavigate('login')}
                className='px-1 font-bold text-primary'
              >
                Sign In
              </Button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
