import { useState } from 'react';
import { X, LayoutDashboard, Palette, Wallet, Users, CalendarCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon:    LayoutDashboard,
    title:   'Your Event Dashboard',
    desc:    'Track your overall event readiness score, see upcoming tasks, and get a snapshot of every area at a glance.',
    color:   'hsl(43,74%,49%)',
  },
  {
    icon:    Palette,
    title:   'Vision Board',
    desc:    'Build your aesthetic — pick color palettes, choose style keywords, and pin inspiration images for every part of your event.',
    color:   '#c084fc',
  },
  {
    icon:    Wallet,
    title:   'Budget Tracker',
    desc:    'Set your total budget, track every expense by category, and get alerted before you overspend.',
    color:   '#2dd4bf',
  },
  {
    icon:    Users,
    title:   'Guest Manager',
    desc:    'Add guests, send RSVP links, track responses, assign tables, and import bulk lists via CSV.',
    color:   '#60a5fa',
  },
  {
    icon:    CalendarCheck,
    title:   'Timeline',
    desc:    'See all your pre-event tasks grouped by urgency — and add your own custom tasks for anything specific to your event.',
    color:   '#22c55e',
  },
  {
    icon:    Package,
    title:   'My Order',
    desc:    "Monitor the live status of everything you've booked — from preparation through to delivery.",
    color:   '#f97316',
  },
];

interface WorkspaceOnboardingProps {
  eventId: string;
  onDone:  () => void;
}

export function WorkspaceOnboarding({ eventId, onDone }: WorkspaceOnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === STEPS.length - 1;

  function finish() {
    localStorage.setItem(`cs_onboarded_${eventId}`, '1');
    onDone();
  }

  return (
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70'>
      <div
        className='w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl'
        style={{ background: 'hsl(155,45%,11%)', border: '1px solid hsl(155,38%,22%)' }}
      >
        {/* Gold strip */}
        <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

        <div className='p-6'>
          {/* Dismiss */}
          <div className='flex justify-end mb-2'>
            <button onClick={finish} className='p-1 rounded-lg hover:bg-white/10 transition-colors'>
              <X className='w-4 h-4' style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>

          {/* Icon */}
          <div
            className='w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto'
            style={{ background: `${current.color}20`, border: `1px solid ${current.color}40` }}
          >
            <Icon className='w-7 h-7' style={{ color: current.color }} />
          </div>

          {/* Content */}
          <div className='text-center mb-6'>
            <p className='text-xs font-semibold uppercase tracking-widest mb-2' style={{ color: 'hsl(43,60%,65%)' }}>
              {step + 1} of {STEPS.length}
            </p>
            <h2 className='text-lg font-black text-white mb-2' style={{ fontFamily: 'Inter, sans-serif' }}>
              {current.title}
            </h2>
            <p className='text-sm leading-relaxed' style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
              {current.desc}
            </p>
          </div>

          {/* Step dots */}
          <div className='flex justify-center gap-1.5 mb-5'>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className='rounded-full transition-all'
                style={{
                  width:      i === step ? '20px' : '6px',
                  height:     '6px',
                  background: i === step ? 'hsl(43,74%,49%)' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className='flex gap-3'>
            {step > 0 && (
              <Button variant='ghost' className='flex-1 text-white/50' onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            <Button
              className='flex-1 font-bold'
              onClick={() => isLast ? finish() : setStep(s => s + 1)}
            >
              {isLast ? "Let's go!" : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useWorkspaceOnboarding(eventId: string) {
  const key  = `cs_onboarded_${eventId}`;
  const seen = typeof window !== 'undefined' && localStorage.getItem(key) === '1';
  const [show, setShow] = useState(!seen);
  return { show, dismiss: () => { localStorage.setItem(key, '1'); setShow(false); } };
}
