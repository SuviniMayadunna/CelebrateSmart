import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Calendar, MapPin, Loader2, Heart } from 'lucide-react';
import { rsvpAPI } from '@/lib/api';

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Wedding', BIRTHDAY: 'Birthday Celebration', PROPOSAL: 'Proposal',
  BABY_SHOWER: 'Baby Shower', KIDS_PARTY: "Kids' Party",
};

interface RsvpData {
  guestName:     string;
  currentStatus: string;
  event: { name: string; date: string; venue: string | null; type: string };
}

interface RsvpPageProps {
  token: string;
}

export function RsvpPage({ token }: RsvpPageProps) {
  const [data,       setData]       = useState<RsvpData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState<'CONFIRMED' | 'DECLINED' | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    rsvpAPI.get(token)
      .then(res => {
        if (res.success) setData(res.data);
        else setError('This RSVP link is not valid or has expired.');
      })
      .catch(() => setError('Unable to load RSVP. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function respond(status: 'CONFIRMED' | 'DECLINED') {
    setSubmitting(true);
    try {
      const res = await rsvpAPI.submit(token, status);
      if (res.success) {
        setDone(status);
        setData(prev => prev ? { ...prev, currentStatus: status } : prev);
      } else {
        setError(res.message ?? 'Failed to submit RSVP.');
      }
    } catch {
      setError('Failed to submit RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const eventDate = data ? new Date(data.event.date) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const alreadyResponded = data && ['CONFIRMED', 'DECLINED'].includes(data.currentStatus) && !done;

  return (
    <div className='min-h-screen flex flex-col items-center justify-center px-4 py-12'
      style={{ background: 'hsl(155,45%,8%)' }}>

      {/* Brand mark */}
      <div className='mb-8 text-center'>
        <p className='text-xs font-semibold uppercase tracking-widest' style={{ color: 'hsl(43,60%,65%)' }}>
          CelebrateSmart
        </p>
      </div>

      <div className='w-full max-w-md'>
        {/* ── Loading ── */}
        {loading && (
          <div className='flex flex-col items-center gap-4 py-16'>
            <Loader2 className='w-8 h-8 animate-spin' style={{ color: 'hsl(43,74%,49%)' }} />
            <p className='text-white/60 text-sm'>Loading your invitation…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className='rounded-2xl p-8 text-center' style={{ background: 'hsl(155,45%,12%)' }}>
            <XCircle className='w-12 h-12 mx-auto mb-4 text-red-400' />
            <p className='text-white font-semibold text-lg mb-2'>Link not found</p>
            <p className='text-white/50 text-sm'>{error}</p>
          </div>
        )}

        {/* ── Main card ── */}
        {!loading && data && (
          <div className='rounded-2xl overflow-hidden shadow-2xl' style={{ background: 'hsl(155,45%,12%)' }}>
            {/* Gold header strip */}
            <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

            <div className='p-8'>
              {/* Greeting */}
              <div className='text-center mb-6'>
                <Heart className='w-8 h-8 mx-auto mb-3' style={{ color: 'hsl(43,74%,49%)' }} />
                <h1 className='text-2xl font-black text-white mb-1' style={{ fontFamily: 'Inter, sans-serif' }}>
                  You're Invited
                </h1>
                <p className='text-white/60 text-sm'>
                  Hi <span className='text-white font-semibold'>{data.guestName}</span>, you've been invited to:
                </p>
              </div>

              {/* Event details */}
              <div className='rounded-xl p-5 mb-6' style={{ background: 'hsl(155,45%,8%)' }}>
                <p className='text-xs font-semibold uppercase tracking-widest mb-1'
                  style={{ color: 'hsl(43,60%,65%)' }}>
                  {EVENT_TYPE_LABELS[data.event.type] ?? data.event.type}
                </p>
                <h2 className='text-xl font-black text-white mb-4' style={{ fontFamily: 'Inter, sans-serif' }}>
                  {data.event.name}
                </h2>
                <div className='flex flex-col gap-2.5'>
                  <div className='flex items-center gap-2.5'>
                    <Calendar className='w-4 h-4 shrink-0' style={{ color: 'hsl(43,74%,49%)' }} />
                    <span className='text-sm text-white/80'>{formattedDate}</span>
                  </div>
                  {data.event.venue && (
                    <div className='flex items-center gap-2.5'>
                      <MapPin className='w-4 h-4 shrink-0' style={{ color: 'hsl(43,74%,49%)' }} />
                      <span className='text-sm text-white/80'>{data.event.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Already responded ── */}
              {alreadyResponded && (
                <div className={`rounded-xl p-4 text-center mb-4 ${
                  data.currentStatus === 'CONFIRMED'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {data.currentStatus === 'CONFIRMED' ? (
                    <>
                      <CheckCircle2 className='w-6 h-6 mx-auto mb-2 text-emerald-400' />
                      <p className='text-emerald-300 font-semibold text-sm'>You've already confirmed attendance!</p>
                    </>
                  ) : (
                    <>
                      <XCircle className='w-6 h-6 mx-auto mb-2 text-red-400' />
                      <p className='text-red-300 font-semibold text-sm'>You've already declined this invitation.</p>
                    </>
                  )}
                  <p className='text-white/40 text-xs mt-1'>You can still change your response below.</p>
                </div>
              )}

              {/* ── Success state ── */}
              {done === 'CONFIRMED' && (
                <div className='rounded-xl p-6 text-center bg-emerald-500/10 border border-emerald-500/20'>
                  <CheckCircle2 className='w-10 h-10 mx-auto mb-3 text-emerald-400' />
                  <p className='text-emerald-300 font-bold text-lg'>See you there!</p>
                  <p className='text-white/50 text-sm mt-1'>Your attendance has been confirmed.</p>
                </div>
              )}

              {done === 'DECLINED' && (
                <div className='rounded-xl p-6 text-center bg-white/5 border border-white/10'>
                  <XCircle className='w-10 h-10 mx-auto mb-3 text-white/40' />
                  <p className='text-white/70 font-bold text-lg'>Sorry you can't make it.</p>
                  <p className='text-white/40 text-sm mt-1'>Your response has been recorded.</p>
                </div>
              )}

              {/* ── RSVP buttons ── */}
              {!done && (
                <div className='flex flex-col gap-3'>
                  <button
                    onClick={() => respond('CONFIRMED')}
                    disabled={submitting}
                    className='w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2'
                    style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,8%)' }}
                  >
                    {submitting ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <CheckCircle2 className='w-4 h-4' />
                    )}
                    Yes, I'll be there!
                  </button>

                  <button
                    onClick={() => respond('DECLINED')}
                    disabled={submitting}
                    className='w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border'
                    style={{ borderColor: 'hsl(155,38%,22%)', color: 'rgba(255,255,255,0.5)' }}
                  >
                    {submitting ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <XCircle className='w-4 h-4' />
                    )}
                    Sorry, can't make it
                  </button>
                </div>
              )}

              {/* Change response link after done */}
              {done && (
                <button
                  onClick={() => setDone(null)}
                  className='w-full text-center text-xs text-white/30 hover:text-white/50 mt-4 transition-colors'
                >
                  Change my response
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
