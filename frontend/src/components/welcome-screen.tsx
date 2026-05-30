import { useEffect, useState } from 'react';
import { AppScreen } from '@/App';
import { packagesAPI } from '@/lib/api';
import type { Package } from '@/lib/api';
import {
  Sparkles, Calendar, CheckCircle2, Star, Shield, Clock,
  ChevronRight, Users,
} from 'lucide-react';

interface WelcomeScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const EVENT_TYPES = [
  { type: 'BIRTHDAY',    emoji: '🎂', label: 'Birthday',    desc: 'Make their day unforgettable with a perfectly planned birthday celebration.' },
  { type: 'WEDDING',     emoji: '💒', label: 'Wedding',     desc: 'Your dream wedding, beautifully coordinated from start to finish.' },
  { type: 'PROPOSAL',    emoji: '💍', label: 'Proposal',    desc: 'Pop the question in a moment they will remember forever.' },
  { type: 'BABY_SHOWER', emoji: '🍼', label: 'Baby Shower', desc: 'Welcome the newest addition with a warm, joyful celebration.' },
  { type: 'KIDS_PARTY',  emoji: '🎈', label: 'Kids Party',  desc: 'Magical parties that spark wonder and create lifelong memories.' },
];

const TIER_CONFIG = {
  BRONZE: { label: 'Bronze', medal: '🥉', color: 'hsl(30,60%,40%)',  border: 'hsl(30,55%,72%)',  bg: 'hsl(30,60%,96%)' },
  SILVER: { label: 'Silver', medal: '🥈', color: 'hsl(220,15%,42%)', border: 'hsl(220,15%,72%)', bg: 'hsl(220,20%,96%)' },
  GOLD:   { label: 'Gold',   medal: '🥇', color: 'hsl(43,60%,32%)',  border: 'hsl(43,70%,68%)',  bg: 'hsl(43,74%,96%)' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️',
  PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️', GIFTS: '🎁',
};

const FEATURES = [
  { icon: Calendar,    title: 'Personalised Event Plans',   desc: 'AI-generated step-by-step plans tailored to your event type, guest count, and preferences.' },
  { icon: CheckCircle2,title: 'Your Checklist & Ours',     desc: 'See exactly what you need to do and what our team handles — with live tick-off progress.' },
  { icon: Users,       title: 'Expert Vendor Team',         desc: 'Cakes, décor, catering, photography — our vetted vendors take care of every detail.' },
  { icon: Clock,       title: 'Smart Reminders',            desc: '7-day, 3-day, and 24-hour reminders delivered to your inbox and notification bell.' },
  { icon: Shield,      title: 'Secure Stripe Payments',     desc: 'Card payments processed securely by Stripe. No data stored on our servers.' },
  { icon: Star,        title: 'Real-time Progress',         desc: 'Track every milestone from booking to event day with a live progress dashboard.' },
];

const STATS = [
  { value: '10K+', label: 'Events Planned' },
  { value: '50K+', label: 'Happy Customers' },
  { value: '99%',  label: 'Success Rate' },
  { value: '5★',   label: 'Average Rating' },
];

function PackageCard({ pkg, onRegister }: { pkg: Package; onRegister: () => void }) {
  const tier = TIER_CONFIG[pkg.tier] ?? TIER_CONFIG.GOLD;
  const photo = pkg.photos?.[0]?.url;
  const categories = [...new Set(pkg.items.map(i => i.category as string))];

  return (
    <div className='bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col'
      style={{ border: `1.5px solid ${tier.border}` }}>

      {/* Photo / placeholder */}
      <div className='relative h-52 overflow-hidden' style={{ background: 'hsl(150,15%,93%)' }}>
        {photo ? (
          <img src={photo} alt={pkg.name} className='w-full h-full object-cover' />
        ) : (
          <div className='w-full h-full flex flex-col items-center justify-center gap-2'
            style={{ background: `linear-gradient(135deg, hsl(155,42%,14%), hsl(155,33%,26%))` }}>
            <span className='text-5xl'>
              {pkg.eventType === 'BIRTHDAY' ? '🎂'
               : pkg.eventType === 'WEDDING' ? '💒'
               : pkg.eventType === 'PROPOSAL' ? '💍'
               : pkg.eventType === 'BABY_SHOWER' ? '🍼'
               : pkg.eventType === 'KIDS_PARTY' ? '🎈' : '🎉'}
            </span>
            <p className='text-sm font-semibold' style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
              {pkg.eventType.replace('_', ' ')}
            </p>
          </div>
        )}
        {/* Tier badge overlay */}
        <div className='absolute top-3 left-3'>
          <span className='text-xs font-bold px-2.5 py-1 rounded-full shadow'
            style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`, fontFamily: 'Inter, sans-serif' }}>
            {tier.medal} {tier.label}
          </span>
        </div>
      </div>

      <div className='p-5 flex flex-col flex-1'>
        {/* Name + price */}
        <div className='flex items-start justify-between gap-2 mb-2'>
          <h3 className='font-bold text-lg leading-snug' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
            {pkg.name}
          </h3>
          <p className='font-serif text-xl font-black shrink-0' style={{ color: 'hsl(43,60%,30%)' }}>
            ${pkg.totalPrice.toLocaleString()}
          </p>
        </div>

        {/* Description */}
        <p className='text-sm mb-3 line-clamp-2' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
          {pkg.description}
        </p>

        {/* Highlights */}
        {pkg.highlights?.length > 0 && (
          <ul className='space-y-1 mb-4'>
            {pkg.highlights.slice(0, 3).map((h, i) => (
              <li key={i} className='flex items-start gap-2 text-xs' style={{ color: 'hsl(155,25%,38%)', fontFamily: 'Inter, sans-serif' }}>
                <CheckCircle2 className='w-3.5 h-3.5 shrink-0 mt-0.5' style={{ color: 'hsl(155,42%,30%)' }} />
                {h}
              </li>
            ))}
          </ul>
        )}

        {/* Category chips */}
        <div className='flex flex-wrap gap-1.5 mb-5'>
          {categories.map(cat => (
            <span key={cat} className='text-xs px-2 py-0.5 rounded-full font-medium'
              style={{ background: 'hsl(155,25%,94%)', color: 'hsl(155,38%,27%)', fontFamily: 'Inter, sans-serif' }}>
              {CATEGORY_EMOJI[cat] ?? '📦'} {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onRegister}
          className='mt-auto w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] hover:opacity-90'
          style={{
            background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))',
            color: 'hsl(155,45%,10%)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Register to Book
        </button>
      </div>
    </div>
  );
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeType, setActiveType] = useState<string>('ALL');

  useEffect(() => {
    packagesAPI.listPublic()
      .then(res => setPackages(res.data.packages))
      .catch(() => {});
  }, []);

  const eventTypesWithPackages = ['ALL', ...Array.from(new Set(packages.map(p => p.eventType)))];
  const filtered = activeType === 'ALL' ? packages : packages.filter(p => p.eventType === activeType);

  return (
    <div className='min-h-screen bg-white font-sans'>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className='sticky top-0 z-50 flex items-center justify-between px-6 py-4'
        style={{ background: 'hsl(155,45%,10%)', borderBottom: '1px solid hsl(155,38%,18%)' }}>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-xl flex items-center justify-center text-lg'
            style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}>
            🎉
          </div>
          <span className='font-serif text-lg font-bold text-white'>CelebrateSmart</span>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => onNavigate('login')}
            className='px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10'
            style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('register')}
            className='px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-105'
            style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className='relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-28'
        style={{ background: 'linear-gradient(145deg, hsl(155,48%,8%) 0%, hsl(155,42%,13%) 50%, hsl(155,40%,17%) 100%)' }}>

        {/* Orbs */}
        <div className='absolute pointer-events-none' style={{ top: '-8rem', right: '-8rem', width: '28rem', height: '28rem', borderRadius: '50%', opacity: 0.18, background: 'radial-gradient(circle, hsl(43,74%,49%) 0%, transparent 70%)', animation: 'pulse-slow 4s cubic-bezier(0.4,0,0.6,1) infinite' }} />
        <div className='absolute pointer-events-none' style={{ bottom: 0, left: '-10rem', width: '32rem', height: '32rem', borderRadius: '50%', opacity: 0.13, background: 'radial-gradient(circle, hsl(155,42%,28%) 0%, transparent 70%)', animation: 'pulse-slow 4s cubic-bezier(0.4,0,0.6,1) infinite', animationDelay: '1.5s' }} />

        <div className='relative z-10 max-w-4xl w-full'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6'
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Sparkles className='w-4 h-4 animate-pulse' style={{ color: 'hsl(43,74%,65%)' }} />
            <span className='text-sm font-medium' style={{ color: 'hsl(43,74%,75%)', fontFamily: 'Inter, sans-serif' }}>
              Sri Lanka's Premier Event Planning Platform
            </span>
          </div>

          <h1 className='text-5xl md:text-7xl font-black text-white mb-6 leading-tight' style={{ letterSpacing: '-0.02em' }}>
            Your Perfect{' '}
            <span style={{ color: 'hsl(43,74%,60%)' }}>Celebration</span>
            <br />Starts Here
          </h1>

          <p className='text-xl md:text-2xl mb-4 max-w-2xl mx-auto leading-relaxed' style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif' }}>
            From concept to celebration — we plan everything so you can enjoy every moment.
          </p>
          <p className='text-base mb-10 max-w-xl mx-auto' style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
            Browse our packages, customize every detail, and let our expert team handle the rest.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-16'>
            <button
              onClick={() => onNavigate('register')}
              className='px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl'
              style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}
            >
              Start Planning Free →
            </button>
            <button
              onClick={() => onNavigate('login')}
              className='px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95'
              style={{ background: 'rgba(255,255,255,0.10)', border: '2px solid rgba(255,255,255,0.28)', color: '#ffffff', fontFamily: 'Inter, sans-serif', backdropFilter: 'blur(8px)' }}
            >
              Sign In
            </button>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto pt-10'
            style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            {STATS.map(s => (
              <div key={s.label} className='text-center'>
                <p className='text-3xl font-black mb-0.5' style={{ color: 'hsl(43,74%,65%)', fontFamily: 'Inter, sans-serif' }}>{s.value}</p>
                <p className='text-xs font-medium' style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Event Types ───────────────────────────────────────────────────── */}
      <section className='py-20 px-6' style={{ background: 'hsl(150,15%,98%)' }}>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12'>
            <p className='text-xs uppercase tracking-widest font-bold mb-2' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>What We Plan</p>
            <h2 className='text-4xl font-black mb-3' style={{ color: 'hsl(155,45%,13%)' }}>Every Celebration, Perfectly Planned</h2>
            <p className='text-lg max-w-xl mx-auto' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
              From intimate proposals to grand weddings — we have expert packages for every occasion.
            </p>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {EVENT_TYPES.map(et => (
              <div key={et.type}
                className='bg-white rounded-2xl p-5 text-center hover:shadow-lg transition-all hover:-translate-y-1 cursor-default'
                style={{ border: '1.5px solid hsl(150,12%,88%)' }}>
                <div className='text-4xl mb-3'>{et.emoji}</div>
                <h3 className='font-bold text-sm mb-1' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{et.label}</h3>
                <p className='text-xs leading-relaxed' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>{et.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className='py-20 px-6 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center mb-14'>
            <p className='text-xs uppercase tracking-widest font-bold mb-2' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>Simple Process</p>
            <h2 className='text-4xl font-black' style={{ color: 'hsl(155,45%,13%)' }}>How CelebrateSmart Works</h2>
          </div>
          <div className='grid md:grid-cols-3 gap-8'>
            {[
              { step: '01', icon: '📦', title: 'Choose Your Package', desc: 'Browse our curated Bronze, Silver and Gold packages for your event type. Each includes expert vendors for every need.' },
              { step: '02', icon: '✏️', title: 'Customize & Pay',     desc: 'Personalize items, set your guest count, pick a color theme, and complete payment securely with Stripe.' },
              { step: '03', icon: '🎉', title: 'We Handle Everything', desc: 'Your personalized checklist and our vendor timeline are generated instantly. Tick off tasks and enjoy the journey.' },
            ].map(item => (
              <div key={item.step} className='relative text-center'>
                <div className='w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl shadow-md'
                  style={{ background: 'linear-gradient(135deg, hsl(155,42%,14%), hsl(155,33%,26%))' }}>
                  {item.icon}
                </div>
                <div className='absolute top-0 right-0 md:right-4 text-6xl font-black opacity-5 select-none leading-none' style={{ color: 'hsl(155,42%,20%)' }}>
                  {item.step}
                </div>
                <h3 className='text-lg font-bold mb-2' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{item.title}</h3>
                <p className='text-sm leading-relaxed' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ──────────────────────────────────────────────────────── */}
      <section className='py-20 px-6' style={{ background: 'hsl(150,15%,97%)' }}>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-10'>
            <p className='text-xs uppercase tracking-widest font-bold mb-2' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>Our Packages</p>
            <h2 className='text-4xl font-black mb-3' style={{ color: 'hsl(155,45%,13%)' }}>Celebration Packages</h2>
            <p className='text-lg max-w-xl mx-auto mb-8' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
              All-inclusive packages handled by our expert team. Register to book and customize any package.
            </p>

            {/* Filter tabs */}
            {eventTypesWithPackages.length > 1 && (
              <div className='flex flex-wrap gap-2 justify-center'>
                {eventTypesWithPackages.map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className='px-4 py-1.5 rounded-full text-sm font-semibold transition-all'
                    style={{
                      background: activeType === type ? 'hsl(155,42%,20%)' : 'white',
                      color: activeType === type ? 'white' : 'hsl(155,25%,42%)',
                      border: `1.5px solid ${activeType === type ? 'hsl(155,42%,20%)' : 'hsl(150,12%,82%)'}`,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {type === 'ALL' ? 'All Events' : type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {packages.length === 0 ? (
            <div className='text-center py-16'>
              <p className='text-4xl mb-3'>📦</p>
              <p className='text-lg font-semibold mb-1' style={{ color: 'hsl(155,38%,22%)', fontFamily: 'Inter, sans-serif' }}>Packages coming soon</p>
              <p className='text-sm' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>Register now to be the first to know when packages are available.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filtered.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} onRegister={() => onNavigate('register')} />
              ))}
            </div>
          )}

          {/* Register CTA below packages */}
          <div className='mt-12 text-center'>
            <p className='text-sm mb-4' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
              Create a free account to book any package and start planning your event.
            </p>
            <button
              onClick={() => onNavigate('register')}
              className='inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105'
              style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
            >
              Create Free Account
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className='py-20 px-6 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-14'>
            <p className='text-xs uppercase tracking-widest font-bold mb-2' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>Why Us</p>
            <h2 className='text-4xl font-black mb-3' style={{ color: 'hsl(155,45%,13%)' }}>Everything You Need in One Place</h2>
            <p className='text-lg max-w-xl mx-auto' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
              CelebrateSmart takes the stress out of event planning so you can focus on celebrating.
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className='rounded-2xl p-6 hover:shadow-md transition-all'
                  style={{ background: 'hsl(150,15%,98%)', border: '1.5px solid hsl(150,12%,88%)' }}>
                  <div className='w-11 h-11 rounded-xl flex items-center justify-center mb-4'
                    style={{ background: 'linear-gradient(135deg, hsl(155,42%,18%), hsl(155,33%,30%))' }}>
                    <Icon className='w-5 h-5 text-white' />
                  </div>
                  <h3 className='font-bold text-base mb-2' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{f.title}</h3>
                  <p className='text-sm leading-relaxed' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className='py-24 px-6 text-center relative overflow-hidden'
        style={{ background: 'linear-gradient(145deg, hsl(155,48%,8%) 0%, hsl(155,42%,13%) 50%, hsl(155,40%,17%) 100%)' }}>
        <div className='absolute pointer-events-none' style={{ top: '-6rem', right: '-6rem', width: '24rem', height: '24rem', borderRadius: '50%', opacity: 0.15, background: 'radial-gradient(circle, hsl(43,74%,49%) 0%, transparent 70%)' }} />
        <div className='relative z-10 max-w-2xl mx-auto'>
          <p className='text-5xl mb-6'>🎉</p>
          <h2 className='text-4xl md:text-5xl font-black text-white mb-4' style={{ letterSpacing: '-0.02em' }}>
            Ready to Celebrate?
          </h2>
          <p className='text-lg mb-10' style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}>
            Join thousands of happy customers who let CelebrateSmart make their special moments truly unforgettable.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button
              onClick={() => onNavigate('register')}
              className='px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-2xl'
              style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}
            >
              Create Free Account
            </button>
            <button
              onClick={() => onNavigate('login')}
              className='px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105'
              style={{ background: 'rgba(255,255,255,0.10)', border: '2px solid rgba(255,255,255,0.28)', color: '#ffffff', fontFamily: 'Inter, sans-serif' }}
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className='py-8 px-6 text-center' style={{ background: 'hsl(155,48%,6%)', borderTop: '1px solid hsl(155,38%,14%)' }}>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <span className='text-lg'>🎉</span>
          <span className='font-serif font-bold text-white'>CelebrateSmart</span>
        </div>
        <p className='text-xs' style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
          © {new Date().getFullYear()} CelebrateSmart. Making celebrations unforgettable.
        </p>
      </footer>

    </div>
  );
}
