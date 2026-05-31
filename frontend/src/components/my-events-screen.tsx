import { useState, useEffect } from 'react';
import { AppScreen, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, Users, LayoutDashboard } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { workspaceAPI } from '@/lib/api';

interface MyEventsScreenProps {
  events: EventData[];
  onNavigate: (screen: AppScreen, event?: EventData) => void;
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

export function MyEventsScreen({ events, onNavigate }: MyEventsScreenProps) {
  const [readinessScores, setReadinessScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const paidEvents = events.filter(e => e.hasPaidOrder && e.status !== 'CANCELED');
    if (paidEvents.length === 0) return;

    Promise.allSettled(
      paidEvents.map(event =>
        workspaceAPI.getDashboard(event.id).then(res => ({
          eventId: event.id,
          score: res.data.dashboard.readiness.score,
        }))
      )
    ).then(results => {
      const scores: Record<string, number> = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          scores[result.value.eventId] = result.value.score;
        }
      });
      setReadinessScores(scores);
    });
  }, [events]);

  // Only show events that have a confirmed payment (paid, preparing, delivered, etc.) or are canceled
  const bookedEvents = events.filter(e => e.hasPaidOrder || e.status === 'CANCELED');

  const handleEventClick = (event: EventData) => {
    if (event.hasPaidOrder) {
      onNavigate('event-workspace', event);
    } else {
      onNavigate('event-workspace', event);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-8'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs uppercase tracking-widest font-semibold mb-1'
                style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                Your Celebrations
              </p>
              <h1 className='text-4xl font-black text-foreground'>My Events</h1>
            </div>
            <Button onClick={() => onNavigate('package-picker')} className='font-bold'>
              <Plus className='w-5 h-5' />
              <span>New Event</span>
            </Button>
          </div>

          {/* Events Grid */}
          {bookedEvents.length === 0 ? (
            <Empty className='bg-card border border-dashed'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Calendar className='size-5' />
                </EmptyMedia>
                <EmptyTitle>No booked events yet</EmptyTitle>
                <EmptyDescription>Book a package to see your confirmed events here.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => onNavigate('package-picker')} className='font-bold'>
                  <Plus className='w-5 h-5' />
                  <span>Create Your First Event</span>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {bookedEvents.map((event) => {
                const isCanceled  = event.status === 'CANCELED';
                const isPaid      = event.hasPaidOrder === true && !isCanceled;
                const accentColor = isCanceled ? 'hsl(0,0%,60%)' : (TYPE_COLORS[event.type] ?? 'hsl(155,42%,20%)');
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
                      {/* Badges row */}
                      <div className='flex items-center gap-2 mb-3 flex-wrap'>
                        <span className='text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide'
                          style={{
                            background: `${accentColor}22`,
                            color: accentColor,
                            fontFamily: 'Inter, sans-serif',
                          }}>
                          {EVENT_EMOJIS[event.type] ?? '🎉'} {event.type.replace(/_/g, ' ')}
                        </span>
                        {isCanceled ? (
                          <span className='text-xs font-bold px-2.5 py-0.5 rounded-full'
                            style={{ background: 'hsl(0,55%,95%)', color: 'hsl(0,55%,38%)', fontFamily: 'Inter, sans-serif' }}>
                            ✕ Cancelled
                          </span>
                        ) : isPaid && (
                          <span className='text-xs font-bold px-2.5 py-0.5 rounded-full'
                            style={{ background: 'hsl(142,60%,94%)', color: 'hsl(142,65%,22%)', fontFamily: 'Inter, sans-serif' }}>
                            ✓ Paid
                          </span>
                        )}
                      </div>

                      {/* Event name */}
                      <h3 className='text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-1'
                        style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                        {event.name}
                      </h3>

                      {/* Details */}
                      <div className='space-y-1.5 mb-4'>
                        <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                          <Calendar className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                          <span>{event.date}</span>
                          <span className='opacity-30'>·</span>
                          <Clock className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                          <span>{event.time}</span>
                        </div>
                        <div className='flex items-center gap-2 text-sm' style={{ fontFamily: 'Inter, sans-serif' }}>
                          <MapPin className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                          {event.venue && event.venue !== 'To be determined'
                            ? <span className='truncate' style={{ color: 'hsl(150,8%,48%)' }}>{event.venue}</span>
                            : <span className='italic' style={{ color: 'hsl(150,8%,68%)' }}>Venue to be confirmed</span>
                          }
                        </div>
                        {event.guestCount != null && (
                          <div className='flex items-center gap-2 text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                            <Users className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,46%)' }} />
                            <span>{event.guestCount} guests</span>
                          </div>
                        )}
                      </div>

                      {isPaid ? (
                        /* Readiness score */
                        <div className='pt-3 border-t' style={{ borderColor: 'hsl(150,12%,92%)' }}>
                          {(() => {
                            const score = readinessScores[event.id] ?? progressPct;
                            const scoreColor = score >= 80 ? 'hsl(142,65%,28%)' : score >= 50 ? 'hsl(43,74%,40%)' : 'hsl(155,38%,27%)';
                            return (
                              <>
                                <div className='flex items-center justify-between mb-1.5'>
                                  <span className='text-xs font-semibold uppercase tracking-wide'
                                    style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                                    READINESS
                                  </span>
                                  <span className='text-xs font-bold' style={{ color: scoreColor, fontFamily: 'Inter, sans-serif' }}>
                                    {score}%
                                  </span>
                                </div>
                                <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'hsl(150,12%,90%)' }}>
                                  <div
                                    className='h-full rounded-full transition-all duration-500'
                                    style={{
                                      width: `${score}%`,
                                      background: `linear-gradient(90deg, ${accentColor}, hsl(43,60%,62%))`,
                                    }}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        /* Progress bar */
                        <div className='pt-3 border-t' style={{ borderColor: 'hsl(150,12%,92%)' }}>
                          <div className='flex items-center justify-between mb-1.5'>
                            <span className='text-xs font-semibold uppercase tracking-wide'
                              style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                              PROGRESS
                            </span>
                            <span className='text-xs font-bold'
                              style={{
                                color: 'hsl(155,22%,46%)',
                                fontFamily: 'Inter, sans-serif',
                              }}>
                              {totalSteps > 0 ? `${progressPct}%` : 'Planning'}
                            </span>
                          </div>
                          <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'hsl(150,12%,90%)' }}>
                            <div
                              className='h-full rounded-full transition-all duration-500'
                              style={{
                                width: `${progressPct}%`,
                                background: 'linear-gradient(90deg, hsl(155,42%,20%), hsl(155,33%,38%))',
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Open Workspace button — paid events only */}
                      {isPaid && (
                        <div className='mt-4 pt-3 border-t' style={{ borderColor: 'hsl(150,12%,92%)' }}>
                          <button
                            onClick={e => { e.stopPropagation(); onNavigate('event-workspace', event); }}
                            className='w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80'
                            style={{
                              background: `linear-gradient(90deg, ${accentColor}18, hsl(43,74%,49%)18)`,
                              color: accentColor,
                              border: `1px solid ${accentColor}40`,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            <LayoutDashboard className='w-3.5 h-3.5' />
                            Open Workspace
                          </button>
                        </div>
                      )}
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
