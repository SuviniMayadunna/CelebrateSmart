import { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, X, Clock, Flag, Wrench, User, Building2, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { eventPlanAPI, type PlanStep, type EventPlan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  GENERAL:       { label: 'Your Tasks',    color: '#60a5fa', icon: User },
  CAKES:         { label: 'Cake',          color: '#f9a8d4', icon: Building2 },
  FOOD:          { label: 'Catering',      color: '#f97316', icon: Building2 },
  DECORATIONS:   { label: 'Decorations',   color: '#c084fc', icon: Building2 },
  PHOTOGRAPHY:   { label: 'Photography',   color: '#a78bfa', icon: Building2 },
  ENTERTAINMENT: { label: 'Entertainment', color: '#fbbf24', icon: Building2 },
  VENUE:         { label: 'Venue',         color: '#2dd4bf', icon: Building2 },
  GIFTS:         { label: 'Gifts',         color: '#86efac', icon: Building2 },
  MANAGEMENT:    { label: 'Management',    color: 'hsl(43,74%,49%)', icon: Wrench },
  CUSTOM:        { label: 'My Tasks',      color: '#64748b', icon: Flag },
};

function catConfig(cat: string | null) {
  return CATEGORY_CONFIG[cat ?? 'GENERAL'] ?? { label: cat ?? 'Other', color: '#64748b', icon: Circle };
}

interface GroupedSection {
  label:      string;
  badge:      string;
  steps:      PlanStep[];
  badgeColor: string;
}

function groupSteps(steps: PlanStep[], eventDate: Date): GroupedSection[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDates = steps.map(s => ({
    ...s,
    dueDate: s.timeOfDay
      ? eventDate
      : new Date(eventDate.getTime() - s.weeksBefore * 7 * 24 * 60 * 60 * 1000),
  }));

  const eventDaySteps = withDates.filter(s => s.timeOfDay !== null)
    .sort((a, b) => (a.timeOfDay ?? '').localeCompare(b.timeOfDay ?? ''));
  const leadUpSteps = withDates.filter(s => s.timeOfDay === null);

  const weekMs  = 7  * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;

  const overdue   = leadUpSteps.filter(s => !s.isCompleted && s.dueDate < today).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const thisWeek  = leadUpSteps.filter(s => !s.isCompleted && s.dueDate >= today && s.dueDate.getTime() - today.getTime() <= weekMs).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const thisMonth = leadUpSteps.filter(s => !s.isCompleted && s.dueDate.getTime() - today.getTime() > weekMs && s.dueDate.getTime() - today.getTime() <= monthMs).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const upcoming  = leadUpSteps.filter(s => !s.isCompleted && s.dueDate.getTime() - today.getTime() > monthMs).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const done      = withDates.filter(s => s.isCompleted).sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());

  const sections: GroupedSection[] = [];
  if (overdue.length)       sections.push({ label: 'Overdue',     badge: String(overdue.length),    badgeColor: '#ef4444', steps: overdue });
  if (thisWeek.length)      sections.push({ label: 'This Week',   badge: String(thisWeek.length),   badgeColor: '#f59e0b', steps: thisWeek });
  if (thisMonth.length)     sections.push({ label: 'This Month',  badge: String(thisMonth.length),  badgeColor: '#60a5fa', steps: thisMonth });
  if (upcoming.length)      sections.push({ label: 'Upcoming',    badge: String(upcoming.length),   badgeColor: '#94a3b8', steps: upcoming });
  if (eventDaySteps.length) sections.push({ label: 'Event Day',   badge: '🎉',                      badgeColor: 'hsl(43,74%,49%)', steps: eventDaySteps });
  if (done.length)          sections.push({ label: 'Completed',   badge: String(done.length),       badgeColor: '#22c55e', steps: done });
  return sections;
}

function CountdownBanner({ eventDate, eventName }: { eventDate: Date; eventName: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff    = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isPast  = diff < 0;
  const isToday = diff === 0;
  const weeks   = Math.floor(diff / 7);
  const days    = diff % 7;

  let countdownText = '';
  if (isPast)        countdownText = 'Event has passed';
  else if (isToday)  countdownText = 'Today is the big day! 🎉';
  else if (weeks > 0 && days > 0) countdownText = `${weeks}w ${days}d to go`;
  else if (weeks > 0) countdownText = `${weeks} week${weeks !== 1 ? 's' : ''} to go`;
  else countdownText = `${days} day${days !== 1 ? 's' : ''} to go`;

  const pct = isToday || isPast ? 100 : Math.min(100, Math.max(0, Math.round(((16 * 7 - diff) / (16 * 7)) * 100)));
  const ringColor = isPast ? '#94a3b8' : isToday ? '#22c55e' : diff <= 14 ? '#ef4444' : diff <= 30 ? '#f59e0b' : '#60a5fa';
  const circ = 2 * Math.PI * 28;

  return (
    <div className='rounded-2xl p-5 flex items-center gap-5'
      style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className='relative w-20 h-20 shrink-0 flex items-center justify-center'>
        <svg width='80' height='80' className='-rotate-90'>
          <circle cx='40' cy='40' r='28' fill='none' stroke='#f1f5f9' strokeWidth='6' />
          <circle cx='40' cy='40' r='28' fill='none' stroke={ringColor} strokeWidth='6'
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap='round' style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          {isToday || isPast ? (
            <span className='text-lg'>🎉</span>
          ) : (
            <>
              <span className='text-lg font-black leading-none' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                {diff <= 99 ? diff : `${weeks}w`}
              </span>
              <span className='text-[10px]' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                {diff <= 99 ? 'days' : ''}
              </span>
            </>
          )}
        </div>
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs font-semibold uppercase tracking-widest mb-0.5' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
          Planning Timeline
        </p>
        <h2 className='text-lg font-black truncate' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{eventName}</h2>
        <p className='text-sm font-bold mt-0.5' style={{ color: ringColor, fontFamily: 'Inter, sans-serif' }}>{countdownText}</p>
        <p className='text-xs mt-1' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
          {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

interface AddStepFormProps {
  onAdd:   (title: string, weeksBefore: number, description: string) => Promise<void>;
  onClose: () => void;
}

function AddStepForm({ onAdd, onClose }: AddStepFormProps) {
  const [title,       setTitle]       = useState('');
  const [weeksBefore, setWeeksBefore] = useState('4');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd(title.trim(), parseInt(weeksBefore) || 0, description.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'>
      <div className='w-full max-w-sm rounded-2xl p-6 space-y-4'
        style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className='flex items-center justify-between'>
          <h3 className='font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>Add Custom Task</h3>
          <button onClick={onClose} className='p-1 rounded-lg hover:bg-slate-100'>
            <X className='w-4 h-4' style={{ color: '#64748b' }} />
          </button>
        </div>
        <div className='space-y-3'>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Task *</label>
            <input type='text' placeholder='e.g. Book hair and makeup' value={title}
              onChange={e => setTitle(e.target.value)}
              className='w-full px-3 py-2 rounded-xl text-sm outline-none'
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Weeks before event</label>
            <input type='number' min='0' max='52' value={weeksBefore}
              onChange={e => setWeeksBefore(e.target.value)}
              className='w-full px-3 py-2 rounded-xl text-sm outline-none'
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label className='text-xs font-semibold uppercase tracking-wide mb-1.5 block' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>Notes (optional)</label>
            <textarea placeholder='Any details...' value={description}
              onChange={e => setDescription(e.target.value)} rows={2}
              className='w-full px-3 py-2 rounded-xl text-sm outline-none resize-none'
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: 'Inter, sans-serif' }} />
          </div>
        </div>
        <div className='flex gap-3 pt-1'>
          <Button variant='ghost' className='flex-1' onClick={onClose} disabled={saving}>Cancel</Button>
          <Button className='flex-1 font-bold' onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? <Spinner className='w-4 h-4' /> : 'Add Task'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TimelinePlannerProps {
  eventId:   string;
  eventName: string;
  eventDate: string;
  isPast?:   boolean;
}

export function TimelinePlanner({ eventId, eventName, eventDate, isPast = false }: TimelinePlannerProps) {
  const [plan,               setPlan]               = useState<EventPlan | null>(null);
  const [loading,            setLoading]            = useState(true);
  const [showAddForm,        setShowAddForm]        = useState(false);
  const [collapsedSections,  setCollapsedSections]  = useState<Set<string>>(new Set(['Completed']));

  const parsedEventDate = useMemo(() => new Date(eventDate), [eventDate]);

  useEffect(() => {
    eventPlanAPI.get(eventId)
      .then(res => setPlan(res.data.plan))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const sections = useMemo(() => {
    if (!plan) return [];
    return groupSteps(plan.steps, parsedEventDate);
  }, [plan, parsedEventDate]);

  const totalSteps  = plan?.steps.length ?? 0;
  const doneSteps   = plan?.steps.filter(s => s.isCompleted).length ?? 0;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  async function handleToggle(step: PlanStep) {
    if (isPast) return;
    try {
      if (step.isCompleted) {
        const res = await eventPlanAPI.uncompleteStep(eventId, step.id);
        setPlan(prev => prev ? { ...prev, steps: prev.steps.map(s => s.id === step.id ? res.data.step : s) } : prev);
      } else {
        const res = await eventPlanAPI.completeStep(eventId, step.id);
        setPlan(prev => prev ? { ...prev, steps: prev.steps.map(s => s.id === step.id ? res.data.step : s) } : prev);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update step' });
    }
  }

  async function handleAddCustomStep(title: string, weeksBefore: number, description: string) {
    const res = await eventPlanAPI.addCustomStep(eventId, { title, weeksBefore, description: description || undefined });
    setPlan(prev => prev ? { ...prev, steps: [...prev.steps, res.data.step] } : prev);
    toast({ title: 'Task added' });
  }

  async function handleDeleteStep(step: PlanStep) {
    if (step.category !== 'CUSTOM') return;
    await eventPlanAPI.deleteCustomStep(eventId, step.id);
    setPlan(prev => prev ? { ...prev, steps: prev.steps.filter(s => s.id !== step.id) } : prev);
    toast({ title: 'Task removed' });
  }

  function toggleSection(label: string) {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  if (loading) {
    return <div className='flex items-center justify-center py-24'><Spinner className='size-6' style={{ color: 'hsl(43,74%,49%)' }} /></div>;
  }

  if (!plan) {
    return (
      <div className='flex flex-col items-center justify-center py-20 gap-4'>
        <Clock className='w-10 h-10' style={{ color: '#cbd5e1' }} />
        <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
          No timeline yet. Complete your booking to generate a plan.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      <CountdownBanner eventDate={parsedEventDate} eventName={eventName} />

      {/* Past read-only notice */}
      {isPast && (
        <div className='flex items-center gap-3 px-4 py-3 rounded-xl'
          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Lock className='w-4 h-4 shrink-0' style={{ color: '#64748b' }} />
          <p className='text-sm' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
            This event has passed — timeline is read-only.
          </p>
        </div>
      )}

      {/* Overall progress */}
      <div className='rounded-2xl p-4' style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
            Overall Progress — {doneSteps}/{totalSteps} tasks
          </p>
          <span className='text-sm font-black' style={{ color: progressPct >= 80 ? '#22c55e' : progressPct >= 40 ? '#f59e0b' : '#60a5fa', fontFamily: 'Inter, sans-serif' }}>
            {progressPct}%
          </span>
        </div>
        <div className='h-2.5 rounded-full overflow-hidden' style={{ background: '#f1f5f9' }}>
          <div className='h-full rounded-full transition-all duration-700'
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, hsl(43,74%,49%), #22c55e)' }} />
        </div>
      </div>

      {/* Add custom task */}
      {!isPast && (
        <div className='flex justify-end'>
          <Button size='sm' className='gap-1.5 text-xs font-bold h-8' onClick={() => setShowAddForm(true)}>
            <Plus className='w-3.5 h-3.5' />
            Add Custom Task
          </Button>
        </div>
      )}

      {/* Grouped sections */}
      <div className='space-y-3'>
        {sections.map(section => {
          const isCollapsed = collapsedSections.has(section.label);
          return (
            <div key={section.label} className='rounded-2xl overflow-hidden'
              style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <button
                onClick={() => toggleSection(section.label)}
                className='w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50'
              >
                <span className='text-sm font-bold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{section.label}</span>
                <span className='px-2 py-0.5 rounded-full text-xs font-bold'
                  style={{ background: `${section.badgeColor}15`, color: section.badgeColor, fontFamily: 'Inter, sans-serif' }}>
                  {section.badge}
                </span>
                <div className='ml-auto'>
                  {isCollapsed
                    ? <ChevronRight className='w-4 h-4' style={{ color: '#64748b' }} />
                    : <ChevronDown className='w-4 h-4' style={{ color: '#64748b' }} />
                  }
                </div>
              </button>

              {!isCollapsed && (
                <div className='border-t px-4 pb-3 pt-1 space-y-1' style={{ borderColor: '#f1f5f9' }}>
                  {section.steps.map(step => {
                    const cc = catConfig(step.category);
                    const CatIcon = cc.icon;
                    const dueDate = step.timeOfDay
                      ? null
                      : new Date(parsedEventDate.getTime() - step.weeksBefore * 7 * 24 * 60 * 60 * 1000);
                    const isCustom = step.category === 'CUSTOM';

                    return (
                      <div key={step.id} className='group flex items-start gap-3 py-2.5 border-b last:border-0'
                        style={{ borderColor: '#f8fafc' }}>
                        {step.category === 'MANAGEMENT' ? (
                          <div className='mt-0.5 shrink-0' title='Handled by CelebrateSmart team'>
                            {step.isCompleted
                              ? <CheckCircle2 className='w-5 h-5' style={{ color: '#22c55e' }} />
                              : <Building2 className='w-5 h-5' style={{ color: '#cbd5e1' }} />
                            }
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggle(step)}
                            className={`mt-0.5 shrink-0 transition-transform ${isPast ? 'cursor-default' : 'hover:scale-110'}`}
                            aria-label={step.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                            disabled={isPast}
                          >
                            {step.isCompleted
                              ? <CheckCircle2 className='w-5 h-5' style={{ color: '#22c55e' }} />
                              : <Circle className='w-5 h-5' style={{ color: '#cbd5e1' }} />
                            }
                          </button>
                        )}

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <p className={`text-sm font-semibold leading-snug ${step.isCompleted ? 'line-through' : ''}`}
                              style={{ color: step.isCompleted ? '#94a3b8' : '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                              {step.title}
                            </p>
                            <span className='flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0'
                              style={{ background: `${cc.color}15`, color: cc.color, fontFamily: 'Inter, sans-serif' }}>
                              <CatIcon className='w-2.5 h-2.5' />
                              {cc.label}
                            </span>
                          </div>
                          {step.description && (
                            <p className='text-xs mt-0.5 leading-snug' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                              {step.description}
                            </p>
                          )}
                          <div className='flex items-center gap-3 mt-1'>
                            {step.timeOfDay ? (
                              <span className='text-xs flex items-center gap-1' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
                                <Clock className='w-3 h-3' />
                                {step.timeOfDay}
                              </span>
                            ) : dueDate ? (
                              <span className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                                {step.weeksBefore === 0 ? 'Event day' : `${step.weeksBefore}w before · `}
                                {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : null}
                            {step.isCompleted && step.completedAt && (
                              <span className='text-xs' style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>
                                ✓ {new Date(step.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {isCustom && !isPast && (
                          <button
                            onClick={() => handleDeleteStep(step)}
                            className='shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50'
                          >
                            <Trash2 className='w-3.5 h-3.5 text-red-400' />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 gap-4'>
            <CheckCircle2 className='w-10 h-10' style={{ color: '#22c55e' }} />
            <div className='text-center'>
              <p className='text-sm font-semibold' style={{ color: '#0f172a' }}>All tasks complete!</p>
              <p className='text-xs mt-1' style={{ color: '#64748b' }}>
                {isPast ? 'Great job planning this event.' : 'Add custom tasks above if you have more to track.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <AddStepForm onAdd={handleAddCustomStep} onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
