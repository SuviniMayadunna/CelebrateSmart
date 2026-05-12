import { AppScreen } from '@/App';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute top-1/2 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute bottom-0 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10 flex items-center justify-center min-h-screen px-4 py-12'>
        <div className='max-w-6xl w-full'>
          {/* Hero Section */}
          <div className='text-center space-y-8 mb-16'>
            <div className='space-y-4'>
              <h1 className='text-6xl md:text-7xl font-black text-white tracking-tight'>
                CelebrateSmart
              </h1>
              <div className='flex items-center justify-center space-x-2'>
                <Sparkles className='w-6 h-6 text-yellow-300 animate-pulse' />
                <p className='text-2xl md:text-3xl text-white/90 font-medium'>
                  Your celebration, perfectly planned
                </p>
                <Sparkles className='w-6 h-6 text-yellow-300 animate-pulse' />
              </div>
            </div>

            <p className='text-xl text-white/80 max-w-2xl mx-auto leading-relaxed'>
              Experience seamless event planning with our intelligent system. From concept to celebration, 
              we've got everything you need in one beautiful platform.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center pt-8'>
              <Button
                onClick={() => onNavigate('login')}
                size='lg'
                className='h-12 px-10 rounded-2xl font-bold text-base shadow-2xl text-primary bg-white hover:bg-white/90'
              >
                Login
              </Button>
              <Button
                onClick={() => onNavigate('register')}
                size='lg'
                variant='outline'
                className='h-12 px-10 rounded-2xl font-bold text-base bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white'
              >
                Register
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className='mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto'>
            {[
              { value: '10K+', label: 'Events Planned' },
              { value: '50K+', label: 'Happy Customers' },
              { value: '99%', label: 'Success Rate' },
            ].map((stat) => (
              <div key={stat.label} className='text-center'>
                <div className='text-4xl font-black text-white mb-2'>{stat.value}</div>
                <div className='text-white/70 font-medium'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
