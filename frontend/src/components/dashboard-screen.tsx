import { AppScreen, User, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, TrendingUp, CheckCircle, Users } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

interface DashboardScreenProps {
  user: User | null;
  events: EventData[];
  onNavigate: (screen: AppScreen, event?: EventData) => void;
  onLogout: () => void;
}

const EVENT_EMOJIS: Record<string, string> = {
  BIRTHDAY: '🎂', WEDDING: '💒', PROPOSAL: '💍', BABY_SHOWER: '🍼', KIDS_PARTY: '🎈',
};

const TYPE_COLORS: Record<string, string> = {
  BIRTHDAY:    'hsl(43,74%,49%)',
  WEDDING:     'hsl(330,65%,55%)',
  PROPOSAL:    'hsl(330,50%,60%)',
  BABY_SHOWER: 'hsl(200,65%,55%)',
  KIDS_PARTY:  'hsl(280,60%,58%)',
};

export function DashboardScreen({ user, events, onNavigate }: DashboardScreenProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inProgressEvents = events.filter(e => new Date(e.date) >= today).length;
  const completedEvents  = events.filter(e => new Date(e.date) < today).length;

  const handleEventClick = (event: EventData) => {
    if (event.hasPaidOrder) {
      onNavigate('event-plan', event);
    } else {
      onNavigate('event-planning', event);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        {/* Header */}
        <div className='mb-8'>
          <p className='text-xs uppercase tracking-widest font-semibold mb-1'
            style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
            Your Dashboard
          </p>
          <h1 className='text-4xl font-black text-foreground mb-1'>
            Welcome back, {user?.name}!
          </h1>
          <p className='text-muted-foreground'>
            {user?.role === 'customer' ? 'Customer' : 'Administrator'} · Let's make your celebrations unforgettable
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          {[
            {
              label:    'Total Events',
              value:    events.length,
              icon:     Calendar,
              bg:       'hsl(155,30%,96%)',
              border:   'hsl(155,25%,82%)',
              iconBg:   'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))',
              valColor: 'hsl(155,45%,13%)',
            },
            {
              label:    'In Progress',
              value:    inProgressEvents,
              icon:     TrendingUp,
              bg:       'hsl(43,74%,98%)',
              border:   'hsl(43,65%,80%)',
              iconBg:   'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))',
              valColor: 'hsl(43,60%,28%)',
            },
            {
              label:    'Completed',
              value:    completedEvents,
              icon:     CheckCircle,
              bg:       'hsl(142,40%,96%)',
              border:   'hsl(142,35%,78%)',
              iconBg:   'linear-gradient(135deg, hsl(142,60%,30%), hsl(142,50%,40%))',
              valColor: 'hsl(142,60%,22%)',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className='rounded-2xl p-6 shadow-sm'
                style={{ background: stat.bg, border: `1.5px solid ${stat.border}` }}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className='w-11 h-11 rounded-xl flex items-center justify-center'
                    style={{ background: stat.iconBg }}>
                    <Icon className='w-5 h-5 text-white' />
                  </div>
                </div>
                <p className='text-sm font-medium text-muted-foreground mb-1'>{stat.label}</p>
                <p className='text-4xl font-black' style={{ color: stat.valColor }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Next-action callout for upcoming paid event */}
        {(() => {
          const upcoming = events
            .filter(e => e.hasPaidOrder === true && new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const next = upcoming[0];
          if (!next) return null;
          const daysUntil = Math.ceil((new Date(next.date).getTime() - Date.now()) / 86400000);
          const subtitle =
            daysUntil > 14 ? 'Review your event plan and confirm your checklist items'
            : daysUntil >= 7 ? 'Confirm all vendor arrangements and venue booking'
            : daysUntil >= 3 ? 'Final preparations — contact your vendors to confirm arrival times'
            : daysUntil >= 1 ? 'Almost there! Confirm your venue and have vendor contacts ready'
            : "Today's the day! 🎉";
          return (
            <div className='mb-8 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3'
              style={{ border: '2px solid hsl(155,42%,75%)', background: 'hsl(155,42%,97%)' }}>
              <div>
                <p className='font-bold text-foreground text-lg'>
                  🗓️ {next.name} is in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                </p>
                <p className='text-sm text-muted-foreground mt-0.5'>{subtitle}</p>
              </div>
              <Button onClick={() => onNavigate('event-plan', next)} variant='outline' className='font-semibold shrink-0'>
                View Plan →
              </Button>
            </div>
          );
        })()}

        {/* Your Events */}
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-3xl font-bold text-foreground'>Your Events</h2>
            <Button onClick={() => onNavigate('event-templates')} className='font-bold'>
              <Plus className='w-5 h-5' />
              <span>New Event</span>
            </Button>
          </div>

          {events.length === 0 ? (
            <Empty className='bg-card border border-dashed'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Calendar className='size-5' />
                </EmptyMedia>
                <EmptyTitle>No events yet</EmptyTitle>
                <EmptyDescription>Start planning your first celebration!</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <button
                  onClick={() => onNavigate('event-templates')}
                  className='px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:opacity-90'
                  style={{
                    background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))',
                    color: 'hsl(155,45%,10%)',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 4px 16px hsl(43,74%,49%,0.35)',
                  }}
                >
                  + Create Your First Event
                </button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {events.map((event) => {
                const isPaid      = event.hasPaidOrder === true;
                const accentColor = TYPE_COLORS[event.type] ?? 'hsl(155,42%,20%)';
                const totalSteps  = event.planStepsTotal ?? 0;
                const doneSteps   = event.planStepsDone ?? 0;
                const progressPct = totalSteps > 0 ? Math.round(doneSteps / totalSteps * 100) : 0;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className='group bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5'
                    style={{ border: '1px solid hsl(150,12%,88%)' }}
                  >
                    {/* Colored top accent */}
                    <div className='h-1.5' style={{
                      background: isPaid
                        ? `linear-gradient(90deg, ${accentColor}, hsl(43,74%,65%))`
                        : 'linear-gradient(90deg, hsl(155,42%,20%), hsl(155,33%,35%))',
                    }} />

                    <div className='p-5'>
                      {/* Badges */}
                      <div className='flex items-center gap-2 mb-3 flex-wrap'>
                        <span className='text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide'
                          style={{
                            background: `${accentColor}22`,
                            color: accentColor,
                            fontFamily: 'Inter, sans-serif',
                          }}>
                          {EVENT_EMOJIS[event.type] ?? '🎉'} {event.type.replace(/_/g, ' ')}
                        </span>
                        {isPaid && (
                          <span className='text-xs font-bold px-2.5 py-0.5 rounded-full'
                            style={{ background: 'hsl(142,60%,94%)', color: 'hsl(142,65%,22%)', fontFamily: 'Inter, sans-serif' }}>
                            ✓ Paid
                          </span>
                        )}
                      </div>

                      <h3 className='text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-1'
                        style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                        {event.name}
                      </h3>

                      <div className='space-y-1.5 mb-4'>
                        <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                          <Calendar className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                          <span>{event.date}</span>
                          <span className='opacity-30'>·</span>
                          <Clock className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                          <span>{event.time}</span>
                        </div>
                        {event.venue && event.venue !== 'To be determined' && (
                          <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                            <MapPin className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                            <span className='truncate'>{event.venue}</span>
                          </div>
                        )}
                        {event.guestCount != null && (
                          <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                            <Users className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                            <span>{event.guestCount} guests</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className='pt-3 border-t' style={{ borderColor: 'hsl(150,12%,92%)' }}>
                        <div className='flex items-center justify-between mb-1.5'>
                          <span className='text-xs font-semibold uppercase tracking-wide'
                            style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                            PROGRESS
                          </span>
                          <span className='text-xs font-bold'
                            style={{ color: isPaid ? 'hsl(155,38%,27%)' : 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                            {totalSteps > 0 ? `${progressPct}%` : (isPaid ? 'Active' : 'Planning')}
                          </span>
                        </div>
                        <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'hsl(150,12%,90%)' }}>
                          <div
                            className='h-full rounded-full transition-all duration-500'
                            style={{
                              width: `${progressPct > 0 ? progressPct : (isPaid ? 15 : 5)}%`,
                              background: isPaid
                                ? `linear-gradient(90deg, ${accentColor}, hsl(43,60%,62%))`
                                : 'linear-gradient(90deg, hsl(155,42%,20%), hsl(155,33%,38%))',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
