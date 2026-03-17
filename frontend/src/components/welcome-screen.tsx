import { AppScreen } from '@/App';
import { Sparkles, Calendar, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute top-1/2 -left-40 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute bottom-0 right-1/4 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-500'></div>
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
              <button
                onClick={() => onNavigate('login')}
                className='px-10 py-5 bg-white text-purple-600 rounded-2xl font-bold hover:scale-105 transition-all shadow-2xl text-lg'
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('register')}
                className='px-10 py-5 bg-purple-900/30 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold hover:bg-purple-900/50 transition-all text-lg'
              >
                Register
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto'>
            {[
              { 
                icon: Calendar, 
                title: 'Smart Planning', 
                desc: 'AI-powered checklists and timelines for stress-free event management',
                color: 'from-purple-500 to-purple-600'
              },
              { 
                icon: ShoppingBag, 
                title: 'Integrated Shop', 
                desc: 'Everything you need in one place - decorations, supplies, and more',
                color: 'from-pink-500 to-pink-600'
              },
              { 
                icon: CheckCircle, 
                title: 'Stay Organized', 
                desc: 'Track progress, set reminders, and never miss an important detail',
                color: 'from-orange-500 to-orange-600'
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title} 
                  className='group bg-white/95 backdrop-blur-sm p-8 rounded-2xl hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer'
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                    <Icon className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='font-bold text-xl mb-3 text-gray-800'>{feature.title}</h3>
                  <p className='text-gray-600 leading-relaxed'>{feature.desc}</p>
                </div>
              );
            })}
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
