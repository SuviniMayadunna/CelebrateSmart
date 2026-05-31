import { useEffect, useState } from 'react';
import { Calendar, Users, Wallet, CheckSquare, Sparkles, ChevronRight, TrendingUp, Clock, PartyPopper } from 'lucide-react';
import { workspaceAPI, type WorkspaceDashboard } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface WorkspaceDashboardProps {
  eventId: string;
  onTabChange: (tab: string) => void;
}

const EVENT_EMOJIS: Record<string, string> = {
  BIRTHDAY: '🎂', WEDDING: '💒', PROPOSAL: '💍', BABY_SHOWER: '🍼', KIDS_PARTY: '🎈',
};

function ReadinessRing({ score, isPast }: { score: number; isPast: boolean }) {
  const radius = 36;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color  = isPast ? '#94a3b8' : score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className='relative w-24 h-24 flex items-center justify-center'>
      <svg width='96' height='96' className='-rotate-90'>
        <circle cx='48' cy='48' r={radius} fill='none' stroke='#e2e8f0' strokeWidth='8' />
        <circle cx='48' cy='48' r={radius} fill='none' stroke={color} strokeWidth='8'
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap='round'
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-2xl font-black' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{score}%</span>
        <span className='text-xs font-medium' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
          {isPast ? 'final' : 'ready'}
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon: Icon, tab, onTabChange }: {
  label: string; value: string | number; sub: string; color: string;
  icon: React.ElementType; tab: string; onTabChange: (t: string) => void;
}) {
  return (
    <button
      onClick={() => onTabChange(tab)}
      className='text-left rounded-2xl overflow-hidden transition-all hover:shadow-md hover:scale-[1.02]'
      style={{ background: 'white', border: `1px solid ${color}30`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className='h-1' style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div className='p-4'>
        <div className='flex items-start justify-between mb-3'>
          <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: `${color}15` }}>
            <Icon className='w-4 h-4' style={{ color }} />
          </div>
          <ChevronRight className='w-3.5 h-3.5' style={{ color: '#cbd5e1' }} />
        </div>
        <p className='text-2xl font-black' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{value}</p>
        <p className='text-xs font-semibold mt-0.5' style={{ color, fontFamily: 'Inter, sans-serif' }}>{label}</p>
        <p className='text-xs mt-1' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{sub}</p>
      </div>
    </button>
  );
}

export function WorkspaceDashboard({ eventId, onTabChange }: WorkspaceDashboardProps) {
  const [data,    setData]    = useState<WorkspaceDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspaceAPI.getDashboard(eventId)
      .then(res => setData(res.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24'>
        <Spinner className='size-6' style={{ color: 'hsl(43,74%,49%)' }} />
      </div>
    );
  }

  if (!data) {
    return <div className='p-8 text-center' style={{ color: '#64748b' }}>Could not load workspace.</div>;
  }

  const { event, readiness, budget, guests, upcomingSteps, visionBoard } = data;
  const isPast = event.daysUntil < 0;
  const emoji  = EVENT_EMOJIS[event.type] ?? '🎉';
  const budgetRemaining = budget.remaining !== null ? `$${budget.remaining.toLocaleString()} left` : 'Not set';
  const budgetSub       = budget.remaining !== null
    ? `of $${budget.total.toLocaleString()} budget`
    : isPast ? 'Budget not tracked' : 'Tap to set your budget';

  const nextActions: string[] = [];
  if (!isPast) {
    if (!readiness.budget.isSet)              nextActions.push('Set your total event budget');
    if (readiness.visionBoard.pinCount === 0) nextActions.push('Add inspiration to your vision board');
    if (readiness.guests.total === 0)         nextActions.push('Start adding guests to your list');
    if (readiness.tasks.done === 0 && readiness.tasks.total > 0) nextActions.push('Begin checking off your planning tasks');
    if (nextActions.length === 0 && readiness.score < 100) nextActions.push('Keep completing tasks to reach 100% readiness');
  }

  return (
    <div className='space-y-6'>
      {/* Event hero card */}
      <div
        className='rounded-2xl p-6'
        style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='text-2xl'>{emoji}</span>
              <span className='text-xs font-bold uppercase tracking-widest' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
                {event.type.replace('_', ' ')}
              </span>
            </div>
            <h2 className='text-2xl font-black truncate' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{event.name}</h2>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 mt-2'>
              {event.venue && (
                <span className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                  📍 {event.venue}
                </span>
              )}
              <span className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {event.daysUntil > 0 ? (
                <span className='text-sm font-bold' style={{ color: 'hsl(43,74%,40%)', fontFamily: 'Inter, sans-serif' }}>
                  ⏱ {event.daysUntil} days away
                </span>
              ) : (
                <span className='text-sm font-bold' style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>
                  {event.daysUntil === 0 ? '🎉 Today!' : '✅ Past'}
                </span>
              )}
            </div>
            {event.packageName && (
              <div className='mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold'
                style={{ background: 'rgba(251,191,36,0.12)', color: 'hsl(43,74%,40%)', border: '1px solid rgba(251,191,36,0.25)', fontFamily: 'Inter, sans-serif' }}>
                <Sparkles className='w-3 h-3' />
                {event.packageName}
              </div>
            )}
          </div>
          <ReadinessRing score={readiness.score} isPast={isPast} />
        </div>
      </div>

      {/* Past event banner */}
      {isPast && (
        <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <PartyPopper className='w-4 h-4 shrink-0' style={{ color: '#64748b' }} />
          <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            This event has already taken place. Your workspace is now a read-only record.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <StatCard
          label='Budget remaining' value={budgetRemaining} sub={budgetSub}
          color='#22c55e' icon={Wallet} tab='budget' onTabChange={onTabChange}
        />
        <StatCard
          label='Guests confirmed' value={`${guests.confirmed}/${guests.total}`}
          sub={guests.total === 0 ? (isPast ? 'No guests added' : 'Add your first guest') : `${guests.pending} pending`}
          color='#60a5fa' icon={Users} tab='guests' onTabChange={onTabChange}
        />
        <StatCard
          label='Tasks complete' value={`${readiness.tasks.done}/${readiness.tasks.total}`}
          sub={readiness.tasks.total > 0 ? `${Math.round((readiness.tasks.done / readiness.tasks.total) * 100)}% done` : 'No tasks yet'}
          color='#64748b' icon={CheckSquare} tab='timeline' onTabChange={onTabChange}
        />
        <StatCard
          label='Vision board' value={`${visionBoard.pinCount} pins`}
          sub={visionBoard.pinCount === 0 ? (isPast ? 'No pins saved' : 'Add your first inspiration') : `${visionBoard.styleKeywords.slice(0,2).join(' · ') || 'Style not set'}`}
          color='#c084fc' icon={TrendingUp} tab='vision-board' onTabChange={onTabChange}
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {isPast ? (
          /* Event Recap */
          <div className='rounded-2xl p-5 space-y-4'
            style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className='flex items-center gap-2'>
              <PartyPopper className='w-4 h-4' style={{ color: 'hsl(43,74%,49%)' }} />
              <h3 className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Event recap</h3>
            </div>
            {[
              { label: 'Tasks completed',   value: `${readiness.tasks.done} of ${readiness.tasks.total}`,  color: '#64748b' },
              { label: 'Guests confirmed',  value: `${guests.confirmed} of ${guests.total}`,                color: '#60a5fa' },
              { label: 'Total spent',       value: budget.total > 0 ? `$${budget.spent.toLocaleString()}` : 'Not tracked', color: '#22c55e' },
              { label: 'Inspiration pins',  value: `${visionBoard.pinCount} pins saved`,                   color: '#c084fc' },
            ].map(row => (
              <div key={row.label} className='flex items-center justify-between'>
                <span className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{row.label}</span>
                <span className='text-sm font-bold' style={{ color: row.color, fontFamily: 'Inter, sans-serif' }}>{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          /* Next actions */
          <div className='rounded-2xl p-5 space-y-3'
            style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className='flex items-center gap-2 mb-1'>
              <Sparkles className='w-4 h-4' style={{ color: 'hsl(43,74%,49%)' }} />
              <h3 className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Next actions</h3>
            </div>
            {nextActions.slice(0, 4).map((action, i) => (
              <div key={i} className='flex items-start gap-3'>
                <div className='mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold'
                  style={{ background: 'rgba(251,191,36,0.15)', color: 'hsl(43,74%,40%)', fontFamily: 'Inter, sans-serif' }}>
                  {i + 1}
                </div>
                <p className='text-sm leading-snug' style={{ color: '#475569', fontFamily: 'Inter, sans-serif' }}>{action}</p>
              </div>
            ))}
            {nextActions.length === 0 && (
              <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                Great work! Your event is well planned.
              </p>
            )}
          </div>
        )}

        {/* Milestones */}
        <div className='rounded-2xl p-5 space-y-3'
          style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className='flex items-center gap-2 mb-1'>
            <Clock className='w-4 h-4' style={{ color: '#60a5fa' }} />
            <h3 className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
              {isPast ? 'Milestones' : 'Upcoming milestones'}
            </h3>
          </div>
          {upcomingSteps.length === 0 ? (
            <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
              {isPast ? 'All milestones passed.' : 'All timeline steps are complete.'}
            </p>
          ) : (
            upcomingSteps.map(step => (
              <button
                key={step.id}
                onClick={() => onTabChange('timeline')}
                className='w-full flex items-center gap-3 text-left group'
              >
                <div className='w-2 h-2 rounded-full shrink-0'
                  style={{ background: isPast ? '#cbd5e1' : 'hsl(43,74%,49%)' }} />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm truncate group-hover:text-slate-900 transition-colors'
                    style={{ color: isPast ? '#94a3b8' : '#475569', fontFamily: 'Inter, sans-serif' }}>
                    {step.title}
                  </p>
                  <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                    {new Date(step.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{step.weeksBefore === 0 ? 'Event day' : `${step.weeksBefore}w before`}
                  </p>
                </div>
                <ChevronRight className='w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity' style={{ color: '#475569' }} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Vision board preview */}
      {(visionBoard.colorPalette.length > 0 || visionBoard.styleKeywords.length > 0) && (
        <button
          onClick={() => onTabChange('vision-board')}
          className='w-full rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md hover:opacity-90'
          style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <Calendar className='w-5 h-5 shrink-0' style={{ color: '#c084fc' }} />
          <div className='flex-1 min-w-0 text-left'>
            <p className='text-sm font-semibold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Vision Board</p>
            <p className='text-xs mt-0.5' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
              {visionBoard.styleKeywords.join(' · ') || 'No style yet'} · {visionBoard.pinCount} pins
            </p>
          </div>
          {visionBoard.colorPalette.length > 0 && (
            <div className='flex items-center gap-1 shrink-0'>
              {visionBoard.colorPalette.map((c, i) => (
                <div key={i} className='w-5 h-5 rounded-full border-2 border-white shadow-sm' style={{ background: c }} />
              ))}
            </div>
          )}
          <ChevronRight className='w-4 h-4 shrink-0' style={{ color: '#cbd5e1' }} />
        </button>
      )}
    </div>
  );
}
