import { useEffect, useMemo, useRef, useState } from 'react';
import { AppScreen, EventData } from '@/App';
import { EventPlan, PlanStep, Package, eventPlanAPI, eventsAPI, packagesAPI, ordersAPI } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, MapPin, CheckCircle2, Circle, ChevronDown, ChevronUp, Users, ChevronRight, Pencil, X, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

interface EventPlanScreenProps {
  event:          EventData;
  initialPlan:    EventPlan | null;
  onNavigate:     (screen: AppScreen) => void;
  onEventUpdate?: (updated: EventData) => void;
}

const EVENT_EMOJIS: Record<string, string> = {
  BIRTHDAY: '🎂', WEDDING: '💒', PROPOSAL: '💍', BABY_SHOWER: '🍼', KIDS_PARTY: '🎈',
};

const CATEGORY_EMOJI: Record<string, string> = {
  GENERAL: '📋', VENUE: '🏛️', FOOD: '🍽️', CAKES: '🎂',
  PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', DECORATIONS: '🎊',
  FLOWERS: '💐', GIFTS: '🎁', MANAGEMENT: '⚙️',
};

const VENDOR_LABEL: Record<string, string> = {
  CAKES: 'Baker', FOOD: 'Catering', PHOTOGRAPHY: 'Photography',
  ENTERTAINMENT: 'Entertainment', DECORATIONS: 'Setup Team',
  VENUE: 'Venue', MANAGEMENT: 'CelebrateSmart', GIFTS: 'Gifts',
};

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

// ── Shared step toggle logic ──────────────────────────────────────────────────
function useStepToggle(plan: EventPlan | null, setPlan: React.Dispatch<React.SetStateAction<EventPlan | null>>, eventId: string) {
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleStep = async (step: PlanStep) => {
    if (!plan || toggling) return;
    setToggling(step.id);
    const prev = [...plan.steps];
    setPlan(p => p ? ({
      ...p,
      steps: p.steps.map(s => s.id === step.id
        ? { ...s, isCompleted: !s.isCompleted, completedAt: !s.isCompleted ? new Date().toISOString() : null }
        : s),
    }) : p);
    try {
      step.isCompleted
        ? await eventPlanAPI.uncompleteStep(eventId, step.id)
        : await eventPlanAPI.completeStep(eventId, step.id);
    } catch {
      setPlan(p => p ? ({ ...p, steps: prev }) : p);
      toast({ variant: 'destructive', title: 'Failed to update step' });
    } finally {
      setToggling(null);
    }
  };

  return { toggleStep, toggling };
}

// ── Step card (shared between both sections) ──────────────────────────────────
function StepCard({
  step, toggling, onToggle, isDayOf, isVendor,
}: {
  step:     PlanStep;
  toggling: string | null;
  onToggle: (step: PlanStep) => void;
  isDayOf:  boolean;
  isVendor: boolean;
}) {
  return (
    <div
      className='flex items-start gap-4 px-5 py-4 transition-colors'
      style={{ background: step.isCompleted ? 'hsl(150,15%,99%)' : 'white' }}
    >
      <button
        onClick={() => onToggle(step)}
        disabled={toggling === step.id}
        className='mt-0.5 flex-shrink-0 transition-transform hover:scale-110'
      >
        {toggling === step.id
          ? <Spinner className='size-5' />
          : step.isCompleted
            ? <CheckCircle2 className='w-5 h-5' style={{ color: isVendor ? 'hsl(43,65%,38%)' : 'hsl(155,38%,27%)' }} />
            : <Circle className='w-5 h-5' style={{ color: 'hsl(150,10%,70%)' }} />
        }
      </button>
      <div className='flex-1 min-w-0'>
        <div className='flex flex-wrap items-center gap-2 mb-1'>
          {isDayOf && step.timeOfDay && (
            <span
              className='text-xs font-bold px-2 py-0.5 rounded-full'
              style={{
                background: isVendor ? 'hsl(43,74%,49%)' : 'hsl(155,42%,20%)',
                color: isVendor ? 'hsl(155,45%,10%)' : 'white',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {formatTime(step.timeOfDay)}
            </span>
          )}
          {isVendor && step.category && (
            <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
              style={{ background: 'hsl(43,74%,95%)', color: 'hsl(43,60%,30%)', fontFamily: 'Inter, sans-serif' }}>
              {CATEGORY_EMOJI[step.category] ?? '⚙️'} {VENDOR_LABEL[step.category] ?? step.category}
            </span>
          )}
          {!isVendor && step.category && (
            <span className='text-xs' style={{ color: 'hsl(155,15%,52%)', fontFamily: 'Inter, sans-serif' }}>
              {CATEGORY_EMOJI[step.category] ?? '📋'} {step.category}
            </span>
          )}
        </div>
        <p
          className='text-sm font-semibold mb-1 transition-all'
          style={{
            color: step.isCompleted ? 'hsl(150,8%,55%)' : 'hsl(155,45%,13%)',
            textDecoration: step.isCompleted ? 'line-through' : 'none',
          }}
        >
          {step.title}
        </p>
        {step.description && (
          <p className='text-xs leading-relaxed' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
            {step.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Collapsible week group ────────────────────────────────────────────────────
function WeekGroup({
  weeksBefore, steps, isDayOf, isVendor, toggling, onToggle,
}: {
  weeksBefore: number;
  steps:       PlanStep[];
  isDayOf:     boolean;
  isVendor:    boolean;
  toggling:    string | null;
  onToggle:    (step: PlanStep) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const label = weeksBefore === 0 ? 'Event Day' : weeksBefore === 1 ? '1 Week Before' : `${weeksBefore} Weeks Before`;
  const done  = steps.filter(s => s.isCompleted).length;

  return (
    <div className='rounded-2xl border overflow-hidden'
      style={{ borderColor: isDayOf ? (isVendor ? 'hsl(43,65%,70%)' : 'hsl(155,35%,70%)') : 'hsl(150,12%,88%)' }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className='w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50/50'
        style={{ background: isDayOf ? (isVendor ? 'hsl(43,74%,97%)' : 'hsl(155,25%,97%)') : 'hsl(150,8%,99%)' }}
      >
        <div className='flex items-center gap-3'>
          {done === steps.length
            ? <CheckCircle2 className='w-4 h-4' style={{ color: isVendor ? 'hsl(43,65%,38%)' : 'hsl(155,38%,27%)' }} />
            : <Circle className='w-4 h-4' style={{ color: 'hsl(150,10%,70%)' }} />
          }
          <div>
            <p className='text-sm font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
              {isDayOf && '🗓️ '}{label}
            </p>
            <p className='text-xs' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
              {done}/{steps.length} {isVendor ? 'confirmed' : 'done'}
            </p>
          </div>
        </div>
        {collapsed
          ? <ChevronDown className='w-4 h-4' style={{ color: 'hsl(155,15%,52%)' }} />
          : <ChevronUp   className='w-4 h-4' style={{ color: 'hsl(155,15%,52%)' }} />
        }
      </button>
      {!collapsed && (
        <div className='divide-y' style={{ borderColor: 'hsl(150,12%,90%)' }}>
          {steps.map(step => (
            <StepCard
              key={step.id}
              step={step}
              toggling={toggling}
              onToggle={onToggle}
              isDayOf={isDayOf}
              isVendor={isVendor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helper: group steps by weeksBefore ───────────────────────────────────────
function groupByWeek(steps: PlanStep[]) {
  const byWeek: Record<number, PlanStep[]> = {};
  for (const s of steps) {
    (byWeek[s.weeksBefore] ??= []).push(s);
  }
  return Object.keys(byWeek)
    .map(Number)
    .sort((a, b) => b - a)
    .map(w => ({
      weeksBefore: w,
      isDayOf: w === 0,
      steps: byWeek[w].sort((a, b) => {
        if (a.timeOfDay && b.timeOfDay) return a.timeOfDay.localeCompare(b.timeOfDay);
        if (a.timeOfDay) return 1;
        if (b.timeOfDay) return -1;
        return 0;
      }),
    }));
}

// ── Stripe payment form for guest count increase ──────────────────────────────
function GuestAdjustmentPaymentForm({
  eventId, newGuestCount, adjustmentAmount, paymentIntentId, onClose, onSuccess,
}: {
  eventId:          string;
  newGuestCount:    number;
  adjustmentAmount: number;
  paymentIntentId:  string;
  onClose:          () => void;
  onSuccess:        (newCount: number) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying,   setPaying]   = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) { setPayError(error.message ?? 'Payment failed'); return; }

      await eventsAPI.confirmGuestAdjustment(eventId, newGuestCount, paymentIntentId);
      toast({ title: 'Guest count updated', description: `Now ${newGuestCount} guests. Payment confirmed.` });
      onSuccess(newGuestCount);
    } catch {
      setPayError('Payment confirmation failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-2xl p-4' style={{ background: 'hsl(43,74%,97%)', border: '1.5px solid hsl(43,65%,82%)' }}>
        <p className='text-xs font-semibold uppercase tracking-wide mb-1' style={{ color: 'hsl(43,55%,35%)', fontFamily: 'Inter, sans-serif' }}>
          Additional Charge for {newGuestCount} guests
        </p>
        <p className='text-2xl font-black' style={{ color: 'hsl(43,55%,28%)', fontFamily: 'Inter, sans-serif' }}>
          ${adjustmentAmount.toFixed(2)}
        </p>
      </div>
      <PaymentElement />
      {payError && <p className='text-xs font-medium' style={{ color: 'hsl(0,70%,45%)' }}>{payError}</p>}
      <div className='flex gap-3 pt-2'>
        <button onClick={onClose} disabled={paying}
          className='flex-1 py-3 rounded-2xl text-sm font-semibold'
          style={{ background: 'hsl(150,10%,95%)', color: 'hsl(155,22%,35%)', fontFamily: 'Inter, sans-serif' }}>
          Cancel
        </button>
        <button onClick={handlePay} disabled={paying || !stripe}
          className='flex-1 py-3 rounded-2xl text-sm font-semibold disabled:opacity-60 transition-all hover:scale-[1.02]'
          style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}>
          {paying ? 'Processing…' : `Pay $${adjustmentAmount.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
interface EditForm { name: string; date: string; time: string; venue: string; notes: string; guestCount: string; }

interface GuestChargeState { clientSecret: string; paymentIntentId: string; newGuestCount: number; adjustmentAmount: number; }

function EditEventModal({
  event, onClose, onSave,
}: {
  event:   EventData;
  onClose: () => void;
  onSave:  (updated: EventData) => void;
}) {
  const [form, setForm] = useState<EditForm>({
    name:       event.name,
    date:       event.date,
    time:       event.time,
    venue:      event.venue ?? '',
    notes:      event.notes ?? '',
    guestCount: event.guestCount != null ? String(event.guestCount) : '',
  });
  const [saving,      setSaving]      = useState(false);
  const [guestCharge, setGuestCharge] = useState<GuestChargeState | null>(null);

  const set = (field: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.date || !form.time) {
      toast({ variant: 'destructive', title: 'Name, date and time are required' });
      return;
    }
    setSaving(true);
    try {
      const newGuestCount = form.guestCount ? Number(form.guestCount) : null;
      const guestChanged  = newGuestCount != null && newGuestCount !== event.guestCount && event.hasPaidOrder;

      // Save all non-guest fields first
      const res = await eventsAPI.update(event.id, {
        name:  form.name.trim(),
        date:  form.date,
        time:  form.time,
        venue: form.venue.trim() || 'To be determined',
        notes: form.notes.trim(),
      });
      const updatedEvent: EventData = { ...res.data.event };

      if (guestChanged && newGuestCount) {
        const adjRes = await eventsAPI.adjustGuests(event.id, newGuestCount);
        if (adjRes.data.type === 'CHARGE' && adjRes.data.clientSecret && adjRes.data.paymentIntentId) {
          // Need to collect additional payment — open Stripe form
          setSaving(false);
          setGuestCharge({
            clientSecret:     adjRes.data.clientSecret,
            paymentIntentId:  adjRes.data.paymentIntentId,
            newGuestCount,
            adjustmentAmount: adjRes.data.adjustmentAmount!,
          });
          onSave(updatedEvent); // Save other fields now; guest count updates after payment
          return;
        } else if (adjRes.data.type === 'REFUNDED') {
          toast({
            title: 'Guest count updated',
            description: `Refund of $${adjRes.data.refundAmount!.toFixed(2)} initiated to your original payment method.`,
          });
        }
        updatedEvent.guestCount = newGuestCount;
      }

      onSave(updatedEvent);
      toast({ title: 'Event updated', description: 'Your changes have been saved.' });
      onClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: err?.message ?? 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: 'hsl(150,15%,97%)',
    border: '1.5px solid hsl(150,12%,85%)',
    borderRadius: '0.75rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    color: 'hsl(155,45%,13%)',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginBottom: '0.375rem',
    color: 'hsl(155,22%,40%)',
    fontFamily: 'Inter, sans-serif',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  return (
    <>
      <button type='button' aria-label='Close edit modal' onClick={onClose} className='fixed inset-0 z-[55] bg-black/50' />
      <div className='fixed inset-0 z-[60] flex items-center justify-center p-4' role='dialog' aria-modal='true'>
        <div className='relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden' style={{ background: 'white' }} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-5'
            style={{ background: 'linear-gradient(135deg, hsl(155,42%,14%) 0%, hsl(155,35%,22%) 100%)' }}>
            <div>
              <h2 className='font-serif text-xl font-bold text-white'>Edit Event</h2>
              <p className='text-xs mt-0.5' style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                Changes will be saved to your booking
              </p>
            </div>
            <button onClick={onClose} className='p-2 rounded-xl transition-colors hover:bg-white/10' aria-label='Close'>
              <X className='w-4 h-4 text-white' />
            </button>
          </div>

          {/* Form or Stripe payment */}
          <div className='px-6 py-5 space-y-4'>
            {guestCharge ? (
              <>
                <h3 className='font-semibold text-sm' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                  Additional Payment Required
                </h3>
                <Elements stripe={stripePromise} options={{ clientSecret: guestCharge.clientSecret }}>
                  <GuestAdjustmentPaymentForm
                    eventId={event.id}
                    newGuestCount={guestCharge.newGuestCount}
                    adjustmentAmount={guestCharge.adjustmentAmount}
                    paymentIntentId={guestCharge.paymentIntentId}
                    onClose={() => { setGuestCharge(null); onClose(); }}
                    onSuccess={newCount => {
                      onSave({ ...event, guestCount: newCount });
                      setGuestCharge(null);
                      onClose();
                    }}
                  />
                </Elements>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Event Name</label>
                  <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="e.g. Sarah's 30th Birthday" />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label style={labelStyle}>Date</label>
                    <input type='date' style={inputStyle} value={form.date} onChange={set('date')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Time</label>
                    <input type='time' style={inputStyle} value={form.time} onChange={set('time')} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Venue</label>
                  <input style={inputStyle} value={form.venue} onChange={set('venue')} placeholder='Venue name or address' />
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={form.notes} onChange={set('notes')}
                    placeholder='Any special notes or instructions…' />
                </div>
                {/* Guest count — editable; triggers repricing for paid events */}
                <div>
                  <label style={labelStyle}>
                    Guest Count
                    {event.hasPaidOrder && (
                      <span className='ml-2 normal-case font-normal' style={{ color: 'hsl(43,55%,38%)' }}>
                        · changing this will adjust your payment
                      </span>
                    )}
                  </label>
                  <input
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]*'
                    style={inputStyle}
                    value={form.guestCount}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, guestCount: val }));
                    }}
                    placeholder='Number of guests'
                  />
                  {/* Real-time price preview for paid events */}
                  {(() => {
                    if (!event.hasPaidOrder) return null;
                    const origCount  = event.orderOriginalGuestCount ?? event.guestCount ?? null;
                    const totalPaid  = event.orderTotalAmount ?? null;
                    const newCount   = parseInt(form.guestCount, 10);
                    if (!origCount || !totalPaid || isNaN(newCount) || newCount <= 0 || newCount === origCount) return null;
                    const perGuest   = totalPaid / origCount;
                    const delta      = (newCount - origCount) * perGuest;
                    const newTotal   = totalPaid + delta;
                    const isCharge   = delta > 0;
                    return (
                      <div className='mt-2 rounded-xl p-3 space-y-1.5'
                        style={{
                          background: isCharge ? 'hsl(43,74%,97%)' : 'hsl(142,40%,97%)',
                          border: `1.5px solid ${isCharge ? 'hsl(43,65%,82%)' : 'hsl(142,35%,78%)'}`,
                        }}>
                        <div className='flex justify-between text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                          <span>Original total ({origCount} guests)</span>
                          <span>${totalPaid.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between text-xs font-bold'
                          style={{ color: isCharge ? 'hsl(43,60%,28%)' : 'hsl(142,60%,22%)', fontFamily: 'Inter, sans-serif' }}>
                          <span>{isCharge ? 'Additional charge' : 'Refund'} ({newCount - origCount > 0 ? '+' : ''}{newCount - origCount} guests)</span>
                          <span>{isCharge ? '+' : '−'}${Math.abs(delta).toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between text-xs pt-1.5' style={{ borderTop: '1px solid rgba(0,0,0,0.07)', color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>
                          <span className='font-semibold'>New total ({newCount} guests)</span>
                          <span className='font-bold'>${newTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>

          {!guestCharge && (
            <div className='px-6 pb-6 flex gap-3'>
              <button onClick={onClose}
                className='flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-gray-100'
                style={{ background: 'hsl(150,10%,95%)', color: 'hsl(155,22%,35%)', fontFamily: 'Inter, sans-serif' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className='flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Cancel Booking modal ──────────────────────────────────────────────────────
function CancelBookingModal({
  event, onClose, onCancelled,
}: {
  event:       EventData;
  onClose:     () => void;
  onCancelled: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [result,     setResult]     = useState<{ fee: number; refund: number } | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!event.paidOrderId) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await ordersAPI.cancel(event.paidOrderId);
      setResult({ fee: res.data.cancellationFee, refund: res.data.refundAmount });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <button type='button' aria-label='Close' onClick={onClose} className='fixed inset-0 z-[55] bg-black/50' />
      <div className='fixed inset-0 z-[60] flex items-center justify-center p-4' role='dialog' aria-modal='true'>
        <div className='relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden' style={{ background: 'white' }} onClick={e => e.stopPropagation()}>

          {result ? (
            /* ── Success state ── */
            <div className='p-8 text-center'>
              <p className='text-4xl mb-3'>✅</p>
              <h2 className='font-serif text-xl font-bold mb-2' style={{ color: 'hsl(155,45%,13%)' }}>Booking Cancelled</h2>
              <p className='text-sm mb-5' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                A refund of <strong>${result.refund.toFixed(2)}</strong> has been initiated to your original payment method. Allow 3–5 business days.
              </p>
              <div className='rounded-2xl p-4 mb-5 text-left space-y-2' style={{ background: 'hsl(150,15%,97%)', border: '1px solid hsl(150,12%,88%)' }}>
                <div className='flex justify-between text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                  <span>Cancellation fee (10%)</span>
                  <span className='font-semibold' style={{ color: 'hsl(0,65%,45%)' }}>−${result.fee.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                  <span>Refund amount</span>
                  <span style={{ color: 'hsl(142,60%,28%)' }}>${result.refund.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={onCancelled}
                className='w-full py-3 rounded-2xl text-sm font-semibold'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
              >
                Back to My Events
              </button>
            </div>
          ) : (
            /* ── Confirmation state ── */
            <>
              <div className='flex items-center justify-between px-6 py-5'
                style={{ background: 'linear-gradient(135deg, hsl(0,60%,22%) 0%, hsl(0,50%,35%) 100%)' }}>
                <div>
                  <h2 className='font-serif text-xl font-bold text-white'>Cancel Booking</h2>
                  <p className='text-xs mt-0.5' style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                    This action cannot be undone
                  </p>
                </div>
                <button onClick={onClose} className='p-2 rounded-xl transition-colors hover:bg-white/10' aria-label='Close'>
                  <X className='w-4 h-4 text-white' />
                </button>
              </div>

              <div className='px-6 py-5 space-y-4'>
                <div className='rounded-2xl p-4' style={{ background: 'hsl(0,60%,98%)', border: '1.5px solid hsl(0,55%,88%)' }}>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='w-5 h-5 mt-0.5 shrink-0' style={{ color: 'hsl(0,65%,50%)' }} />
                    <div>
                      <p className='text-sm font-semibold mb-1' style={{ color: 'hsl(0,55%,32%)', fontFamily: 'Inter, sans-serif' }}>
                        A 10% cancellation fee applies
                      </p>
                      <p className='text-xs leading-relaxed' style={{ color: 'hsl(0,40%,45%)', fontFamily: 'Inter, sans-serif' }}>
                        You will receive 90% of your original payment back to your card. Refunds take 3–5 business days.
                      </p>
                    </div>
                  </div>
                </div>

                <p className='text-sm' style={{ color: 'hsl(150,8%,48%)', fontFamily: 'Inter, sans-serif' }}>
                  Are you sure you want to cancel <strong style={{ color: 'hsl(155,45%,13%)' }}>{event.name}</strong>?
                </p>

                {error && (
                  <p className='text-xs font-medium px-3 py-2 rounded-xl' style={{ background: 'hsl(0,60%,97%)', color: 'hsl(0,65%,40%)', fontFamily: 'Inter, sans-serif' }}>
                    {error}
                  </p>
                )}
              </div>

              <div className='px-6 pb-6 flex gap-3'>
                <button onClick={onClose} disabled={cancelling}
                  className='flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-gray-100'
                  style={{ background: 'hsl(150,10%,95%)', color: 'hsl(155,22%,35%)', fontFamily: 'Inter, sans-serif' }}>
                  Keep My Booking
                </button>
                <button onClick={handleConfirm} disabled={cancelling || !event.paidOrderId}
                  className='flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-60'
                  style={{ background: 'linear-gradient(135deg, hsl(0,60%,42%), hsl(0,55%,52%))', color: 'white', fontFamily: 'Inter, sans-serif' }}>
                  {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  BRONZE: { label: 'Bronze', medal: '🥉', bg: 'hsl(30,60%,95%)',   border: 'hsl(30,50%,75%)',   color: 'hsl(30,55%,35%)' },
  SILVER: { label: 'Silver', medal: '🥈', bg: 'hsl(220,20%,95%)',  border: 'hsl(220,15%,75%)',  color: 'hsl(220,20%,35%)' },
  GOLD:   { label: 'Gold',   medal: '🥇', bg: 'hsl(43,74%,95%)',   border: 'hsl(43,65%,72%)',   color: 'hsl(43,60%,30%)' },
};

const PKG_CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️',
  PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️', GIFTS: '🎁',
};

export function EventPlanScreen({ event, initialPlan, onNavigate, onEventUpdate }: EventPlanScreenProps) {
  const [eventData,   setEventData]   = useState<EventData>(event);
  const [plan,        setPlan]        = useState<EventPlan | null>(initialPlan);
  const [fetching,    setFetching]    = useState(!initialPlan);
  const [editOpen,    setEditOpen]    = useState(false);
  const [cancelOpen,  setCancelOpen]  = useState(false);
  const [pkg,         setPkg]         = useState<Package | null>(null);
  const { toggleStep, toggling } = useStepToggle(plan, setPlan, eventData.id);

  const handleEventSave = (updated: EventData) => {
    setEventData(updated);
    onEventUpdate?.(updated);
  };

  useEffect(() => {
    if (initialPlan || !eventData.id) return;
    eventPlanAPI.get(eventData.id)
      .then(res => setPlan(res.data.plan))
      .catch(() => {
        if (!eventData.packageId) {
          toast({ variant: 'destructive', title: 'Failed to load event plan' });
        }
      })
      .finally(() => setFetching(false));
  }, [eventData.id, initialPlan]); // eslint-disable-line

  useEffect(() => {
    if (!eventData.packageId) return;
    packagesAPI.get(eventData.packageId)
      .then(res => setPkg(res.data.package))
      .catch(() => {});
  }, [eventData.packageId]); // eslint-disable-line

  // Silently generate reminder notifications for upcoming steps (guard prevents StrictMode double-fire)
  const reminderFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!plan || !eventData.id) return;
    const key = `${eventData.id}:${plan.id}`;
    if (reminderFiredRef.current === key) return;
    reminderFiredRef.current = key;
    eventPlanAPI.generateReminders(eventData.id);
  }, [plan?.id, eventData.id]); // eslint-disable-line

  const isPackageEvent = !!eventData.packageId;

  const customerSteps = useMemo(() => plan?.steps.filter(s => s.category === 'GENERAL') ?? [], [plan]);
  const vendorSteps   = useMemo(() => plan?.steps.filter(s => s.category !== 'GENERAL') ?? [], [plan]);
  const customerGroups = useMemo(() => groupByWeek(customerSteps), [customerSteps]);
  const vendorGroups   = useMemo(() => groupByWeek(vendorSteps),   [vendorSteps]);
  const allGroups      = useMemo(() => groupByWeek(plan?.steps ?? []), [plan]);

  const daysUntil = useMemo(() => {
    if (!eventData.date) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const evt   = new Date(eventData.date); evt.setHours(0,0,0,0);
    return Math.round((evt.getTime() - today.getTime()) / 86400000);
  }, [eventData.date]);

  const hoursUntilEvent = useMemo(() => {
    if (!eventData.date) return null;
    const evt = new Date(eventData.date);
    if (eventData.time) {
      const [h, m] = eventData.time.split(':').map(Number);
      evt.setHours(h, m, 0, 0);
    }
    return (evt.getTime() - Date.now()) / 3_600_000;
  }, [eventData.date, eventData.time]);

  const canCancel = eventData.hasPaidOrder
    && eventData.status !== 'CANCELED'
    && hoursUntilEvent !== null
    && hoursUntilEvent > 24;

  const countdown = (() => {
    if (daysUntil === null) return null;
    if (daysUntil === 0) return { text: "Today's the day! 🎉", color: 'hsl(155,42%,20%)' };
    if (daysUntil > 0)   return { text: `${daysUntil} day${daysUntil === 1 ? '' : 's'} until your event`, color: 'hsl(155,25%,42%)' };
    return { text: `Event was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`, color: 'hsl(150,10%,52%)' };
  })();

  const customerDone = customerSteps.filter(s => s.isCompleted).length;
  const vendorDone   = vendorSteps.filter(s => s.isCompleted).length;
  const allDone      = plan?.steps.filter(s => s.isCompleted).length ?? 0;
  const allTotal     = plan?.steps.length ?? 0;

  return (
    <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
      {editOpen && (
        <EditEventModal
          event={eventData}
          onClose={() => setEditOpen(false)}
          onSave={handleEventSave}
        />
      )}
      {cancelOpen && (
        <CancelBookingModal
          event={eventData}
          onClose={() => setCancelOpen(false)}
          onCancelled={() => {
            setCancelOpen(false);
            onNavigate('my-events');
          }}
        />
      )}

      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

        {/* ── Event header ── */}
        <div className='mb-8 animate-fade-in'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs uppercase tracking-widest font-semibold'
              style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
              {isPackageEvent ? 'Package Booking' : 'Your Event Plan'}
            </span>
          </div>
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <h1 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
              {EVENT_EMOJIS[eventData.type] ?? '🎉'} {eventData.name}
            </h1>
            {eventData.hasPaidOrder && eventData.status !== 'CANCELED' && (
              <div className='flex items-center gap-2 shrink-0 mt-1'>
                <button
                  onClick={() => setEditOpen(true)}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03]'
                  style={{ background: 'hsl(155,38%,18%)', color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter, sans-serif' }}
                >
                  <Pencil className='w-3 h-3' />
                  Edit Event
                </button>
                <button
                  onClick={() => canCancel && setCancelOpen(true)}
                  disabled={!canCancel}
                  title={!canCancel ? 'Cancellation not available within 24 hours of the event' : 'Cancel this booking'}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed'
                  style={{ background: 'hsl(0,55%,42%)', color: 'white', fontFamily: 'Inter, sans-serif' }}
                >
                  <X className='w-3 h-3' />
                  Cancel Booking
                </button>
              </div>
            )}
            {eventData.status === 'CANCELED' && (
              <span className='shrink-0 mt-1 px-3 py-1.5 rounded-xl text-xs font-bold'
                style={{ background: 'hsl(0,55%,95%)', color: 'hsl(0,55%,38%)', fontFamily: 'Inter, sans-serif', border: '1.5px solid hsl(0,50%,82%)' }}>
                ✕ Cancelled
              </span>
            )}
          </div>
          <div className='mt-4 flex flex-wrap gap-4'>
            {[
              { Icon: Calendar, text: eventData.date },
              { Icon: Clock,    text: eventData.time },
              ...(eventData.venue && eventData.venue !== 'To be determined' ? [{ Icon: MapPin, text: eventData.venue }] : []),
              ...(eventData.guestCount ? [{ Icon: Users, text: `${eventData.guestCount} guests` }] : []),
            ].map(({ Icon, text }) => (
              <div key={text} className='flex items-center gap-1.5 text-sm'
                style={{ color: 'hsl(150,10%,47%)', fontFamily: 'Inter, sans-serif' }}>
                <Icon className='w-4 h-4' style={{ color: 'hsl(155,22%,46%)' }} />
                {text}
              </div>
            ))}
          </div>
          {countdown && (
            <p className='mt-3 text-sm font-semibold' style={{ color: countdown.color, fontFamily: 'Inter, sans-serif' }}>
              {countdown.text}
            </p>
          )}

          {/* Package info card */}
          {pkg && (() => {
            const tier = TIER_CONFIG[pkg.tier] ?? TIER_CONFIG.GOLD;
            const categories = [...new Set(pkg.items.map(i => i.category as string))];
            return (
              <div className='mt-5 rounded-2xl px-5 py-4 flex flex-wrap items-start gap-4'
                style={{ background: tier.bg, border: `1.5px solid ${tier.border}` }}>
                {/* Tier + name */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-xs font-bold px-2 py-0.5 rounded-full'
                      style={{ background: tier.border, color: tier.color, fontFamily: 'Inter, sans-serif' }}>
                      {tier.medal} {tier.label} Package
                    </span>
                    {eventData.colorTheme && (
                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full'
                        style={{ background: 'hsl(155,25%,94%)', color: 'hsl(155,38%,22%)', fontFamily: 'Inter, sans-serif' }}>
                        🎨 {eventData.colorTheme}
                      </span>
                    )}
                  </div>
                  <p className='font-semibold text-sm' style={{ color: tier.color, fontFamily: 'Inter, sans-serif' }}>
                    {pkg.name}
                  </p>
                </div>
                {/* What's included */}
                <div className='w-full'>
                  <p className='text-xs font-semibold uppercase tracking-wide mb-2'
                    style={{ color: tier.color, fontFamily: 'Inter, sans-serif', opacity: 0.7 }}>
                    What's included
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {categories.map(cat => (
                      <span key={cat} className='text-xs font-semibold px-2.5 py-1 rounded-full'
                        style={{ background: 'rgba(255,255,255,0.7)', color: tier.color, fontFamily: 'Inter, sans-serif', border: `1px solid ${tier.border}` }}>
                        {PKG_CATEGORY_EMOJI[cat] ?? '📦'} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {fetching ? (
          <div className='flex items-center justify-center py-24'>
            <Spinner className='size-5 mr-3' />
            <span style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>Loading your event plan…</span>
          </div>
        ) : !plan || allTotal === 0 ? (
          <div className='bg-white rounded-3xl border-2 p-12 text-center' style={{ borderColor: 'hsl(150,12%,88%)' }}>
            {eventData.packageId ? (
              <>
                <p className='text-4xl mb-4'>💳</p>
                <h2 className='font-serif text-2xl font-bold mb-2' style={{ color: 'hsl(155,45%,13%)' }}>Payment not completed</h2>
                <p className='text-sm mb-6' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                  Complete your package booking to generate your personalised event plan.
                </p>
                <button
                  onClick={() => onNavigate('package-picker')}
                  className='inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]'
                  style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,34%))', color: 'white', fontFamily: 'Inter, sans-serif' }}
                >
                  Complete Booking
                  <ChevronRight className='w-4 h-4' />
                </button>
              </>
            ) : (
              <>
                <p className='text-4xl mb-4'>📋</p>
                <h2 className='font-serif text-2xl font-bold mb-2' style={{ color: 'hsl(155,45%,13%)' }}>No plan yet</h2>
                <p className='text-sm' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                  Book a package to get a personalised event plan.
                </p>
              </>
            )}
          </div>

        ) : isPackageEvent ? (
          /* ════════════════════════════════════════════════════════════════
             PACKAGE EVENT — two-section layout
          ════════════════════════════════════════════════════════════════ */
          <>
            {/* Progress summary cards */}
            <div className='grid grid-cols-2 gap-4 mb-8'>
              {/* Customer checklist progress */}
              <div className='bg-white rounded-2xl border-2 p-5' style={{ borderColor: 'hsl(155,30%,80%)' }}>
                <p className='text-xs uppercase tracking-widest font-bold mb-1'
                  style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>Your Checklist</p>
                <p className='font-serif text-3xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                  {customerDone}<span className='text-lg text-opacity-60'>/{customerSteps.length}</span>
                </p>
                <div className='mt-2 h-1.5 rounded-full' style={{ background: 'hsl(150,12%,90%)' }}>
                  <div className='h-full rounded-full transition-all duration-500'
                    style={{ width: `${customerSteps.length ? Math.round(customerDone/customerSteps.length*100) : 0}%`,
                      background: 'linear-gradient(90deg, hsl(155,38%,27%), hsl(155,30%,40%))' }} />
                </div>
                <p className='text-xs mt-1' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                  tasks completed
                </p>
              </div>

              {/* Vendor timeline progress */}
              <div className='bg-white rounded-2xl border-2 p-5' style={{ borderColor: 'hsl(43,65%,75%)' }}>
                <p className='text-xs uppercase tracking-widest font-bold mb-1'
                  style={{ color: 'hsl(43,60%,35%)', fontFamily: 'Inter, sans-serif' }}>We're Handling</p>
                <p className='font-serif text-3xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                  {vendorDone}<span className='text-lg text-opacity-60'>/{vendorSteps.length}</span>
                </p>
                <div className='mt-2 h-1.5 rounded-full' style={{ background: 'hsl(150,12%,90%)' }}>
                  <div className='h-full rounded-full transition-all duration-500'
                    style={{ width: `${vendorSteps.length ? Math.round(vendorDone/vendorSteps.length*100) : 0}%`,
                      background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,60%,42%))' }} />
                </div>
                <p className='text-xs mt-1' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>
                  milestones confirmed
                </p>
              </div>
            </div>

            {/* ── Section 1: Customer checklist ── */}
            <div className='mb-8'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-8 h-8 rounded-xl flex items-center justify-center'
                  style={{ background: 'hsl(155,42%,20%)' }}>
                  <span className='text-white text-sm'>✓</span>
                </div>
                <div>
                  <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                    Your Checklist
                  </h2>
                  <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                    Things you need to do before your event
                  </p>
                </div>
              </div>
              <div className='space-y-3'>
                {customerGroups.map(g => (
                  <WeekGroup
                    key={g.weeksBefore}
                    weeksBefore={g.weeksBefore}
                    steps={g.steps}
                    isDayOf={g.isDayOf}
                    isVendor={false}
                    toggling={toggling}
                    onToggle={toggleStep}
                  />
                ))}
              </div>
            </div>

            {/* ── Section 2: Vendor timeline ── */}
            <div>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-8 h-8 rounded-xl flex items-center justify-center'
                  style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}>
                  <span className='text-sm' style={{ color: 'hsl(155,45%,10%)' }}>⚙</span>
                </div>
                <div>
                  <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                    What We're Handling for You
                  </h2>
                  <p className='text-xs' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                    Your CelebrateSmart team takes care of these — tick them off as they happen
                  </p>
                </div>
              </div>
              <div className='space-y-3'>
                {vendorGroups.map(g => (
                  <WeekGroup
                    key={g.weeksBefore}
                    weeksBefore={g.weeksBefore}
                    steps={g.steps}
                    isDayOf={g.isDayOf}
                    isVendor={true}
                    toggling={toggling}
                    onToggle={toggleStep}
                  />
                ))}
              </div>
            </div>
          </>

        ) : (
          /* ════════════════════════════════════════════════════════════════
             DIY EVENT — single-list view (unchanged)
          ════════════════════════════════════════════════════════════════ */
          <>
            {/* Progress card */}
            <div className='bg-white rounded-3xl border-2 p-6 mb-8' style={{ borderColor: 'hsl(150,12%,88%)' }}>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                  Overall Progress
                </h2>
                <span className='font-semibold text-sm' style={{ color: 'hsl(155,25%,42%)', fontFamily: 'Inter, sans-serif' }}>
                  {allDone} / {allTotal} steps
                </span>
              </div>
              <div className='h-3 rounded-full overflow-hidden mb-2' style={{ background: 'hsl(150,12%,93%)' }}>
                <div className='h-full rounded-full transition-all duration-500'
                  style={{
                    width: `${allTotal > 0 ? Math.round(allDone/allTotal*100) : 0}%`,
                    background: allDone === allTotal
                      ? 'linear-gradient(90deg, hsl(155,38%,27%), hsl(43,65%,45%))'
                      : 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,60%,60%))',
                  }}
                />
              </div>
              <p className='text-xs' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                {allDone === allTotal ? "🎉 All steps complete! You're ready." : `${allTotal > 0 ? Math.round(allDone/allTotal*100) : 0}% complete`}
              </p>
            </div>

            <div className='space-y-4'>
              {allGroups.map(g => (
                <WeekGroup
                  key={g.weeksBefore}
                  weeksBefore={g.weeksBefore}
                  steps={g.steps}
                  isDayOf={g.isDayOf}
                  isVendor={false}
                  toggling={toggling}
                  onToggle={toggleStep}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => onNavigate('my-events')}
          className='mt-10 text-sm font-semibold transition-colors hover:opacity-70'
          style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}
        >
          ← Back to My Events
        </button>
      </main>
    </div>
  );
}
