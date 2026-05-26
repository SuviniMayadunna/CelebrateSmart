import { AppScreen } from '@/App';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div
      className='min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12'
      style={{ background: 'linear-gradient(145deg, hsl(155,48%,8%) 0%, hsl(155,42%,13%) 50%, hsl(155,40%,17%) 100%)' }}
    >
      {/* Gold orb top-right */}
      <div
        className='absolute pointer-events-none'
        style={{
          top: '-8rem', right: '-8rem', width: '28rem', height: '28rem',
          borderRadius: '50%', opacity: 0.18,
          background: 'radial-gradient(circle, hsl(43,74%,49%) 0%, transparent 70%)',
          animation: 'pulse-slow 4s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
      />
      {/* Green orb bottom-left */}
      <div
        className='absolute pointer-events-none'
        style={{
          bottom: 0, left: '-10rem', width: '32rem', height: '32rem',
          borderRadius: '50%', opacity: 0.13,
          background: 'radial-gradient(circle, hsl(155,42%,28%) 0%, transparent 70%)',
          animation: 'pulse-slow 4s cubic-bezier(0.4,0,0.6,1) infinite',
          animationDelay: '1.5s',
        }}
      />
      {/* Gold orb center */}
      <div
        className='absolute pointer-events-none'
        style={{
          bottom: '20%', right: '25%', width: '20rem', height: '20rem',
          borderRadius: '50%', opacity: 0.10,
          background: 'radial-gradient(circle, hsl(43,74%,49%) 0%, transparent 70%)',
          animation: 'pulse-slow 5s cubic-bezier(0.4,0,0.6,1) infinite',
          animationDelay: '0.8s',
        }}
      />

      <div className='relative z-10 max-w-5xl w-full text-center'>
        {/* Brand */}
        <div className='mb-10 space-y-5'>
          {/* Logo mark */}
          <div className='inline-flex items-center justify-center mb-2'>
            <div
              className='w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl'
              style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}
            >
              🎉
            </div>
          </div>

          <h1
            className='text-6xl md:text-7xl font-black tracking-tight'
            style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            CelebrateSmart
          </h1>

          <div className='flex items-center justify-center gap-3'>
            <Sparkles className='w-5 h-5 animate-pulse' style={{ color: 'hsl(43,74%,65%)' }} />
            <p
              className='text-2xl md:text-3xl font-medium'
              style={{ color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter, sans-serif' }}
            >
              Your celebration, perfectly planned
            </p>
            <Sparkles className='w-5 h-5 animate-pulse' style={{ color: 'hsl(43,74%,65%)' }} />
          </div>

          <p
            className='text-lg max-w-2xl mx-auto leading-relaxed'
            style={{ color: 'rgba(255,255,255,0.68)', fontFamily: 'Inter, sans-serif' }}
          >
            Experience seamless event planning with our intelligent system. From concept to celebration,
            we've got everything you need in one beautiful platform.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-20'>
          <button
            onClick={() => onNavigate('login')}
            className='px-12 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl'
            style={{
              background: '#ffffff',
              color: 'hsl(155,42%,17%)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('register')}
            className='px-12 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95'
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '2px solid rgba(255,255,255,0.28)',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
              backdropFilter: 'blur(8px)',
            }}
          >
            Register
          </button>
        </div>

        {/* Stats */}
        <div
          className='grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-10'
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
        >
          {[
            { value: '10K+', label: 'Events Planned' },
            { value: '50K+', label: 'Happy Customers' },
            { value: '99%',  label: 'Success Rate' },
          ].map((stat) => (
            <div key={stat.label} className='text-center'>
              <div
                className='text-4xl font-black mb-1'
                style={{ color: 'hsl(43,74%,65%)', fontFamily: 'Inter, sans-serif' }}
              >
                {stat.value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
