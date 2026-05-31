import { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Palette, Wallet, Users, CalendarCheck, Package } from 'lucide-react';
import type { AppScreen, EventData } from '@/App';
import { WorkspaceDashboard } from './workspace-dashboard';
import { VisionBoard }        from './vision-board';
import { BudgetTracker }      from './budget-tracker';
import { GuestManager }       from './guest-manager';
import { TimelinePlanner }    from './timeline-planner';
import { OrderTracker }       from './order-tracker';
import { WorkspaceOnboarding, useWorkspaceOnboarding } from './workspace-onboarding';

type WorkspaceTab = 'dashboard' | 'vision-board' | 'budget' | 'guests' | 'timeline' | 'vendors';

interface EventWorkspaceProps {
  event:        EventData;
  initialTab?:  WorkspaceTab;
  onNavigate:    (screen: AppScreen, event?: EventData) => void;
  onEventUpdate: (event: EventData) => void;
}

const TABS: { id: WorkspaceTab; label: string; icon: React.ElementType; mobileLabel: string }[] = [
  { id: 'dashboard',    label: 'Dashboard',    mobileLabel: 'Home',    icon: LayoutDashboard },
  { id: 'vision-board', label: 'Vision Board', mobileLabel: 'Vision',  icon: Palette },
  { id: 'budget',       label: 'Budget',       mobileLabel: 'Budget',  icon: Wallet },
  { id: 'guests',       label: 'Guests',       mobileLabel: 'Guests',  icon: Users },
  { id: 'timeline',     label: 'Timeline',     mobileLabel: 'Timeline',icon: CalendarCheck },
  { id: 'vendors',      label: 'My Order',     mobileLabel: 'Order',   icon: Package },
];

export function EventWorkspace({ event, initialTab = 'dashboard', onNavigate }: EventWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const { show: showOnboarding, dismiss: dismissOnboarding } = useWorkspaceOnboarding(event.id);
  const isPast = event.date ? new Date(event.date) < new Date() : false;

  function renderTab() {
    switch (activeTab) {
      case 'dashboard':
        return <WorkspaceDashboard eventId={event.id} onTabChange={t => setActiveTab(t as WorkspaceTab)} />;
      case 'vision-board':
        return <VisionBoard eventId={event.id} isPast={isPast} colorTheme={event.colorTheme ?? null} />;
      case 'budget':
        return <BudgetTracker eventId={event.id} packageCost={event.orderTotalAmount ?? null} isPast={isPast} />;
      case 'guests':
        return <GuestManager eventId={event.id} targetGuestCount={event.guestCount ?? 0} isPast={isPast} />;
      case 'timeline':
        return (
          <TimelinePlanner
            eventId={event.id}
            eventName={event.name}
            eventDate={event.date}
            isPast={isPast}
          />
        );
      case 'vendors':
        return <OrderTracker eventId={event.id} />;
      default:
        return null;
    }
  }

  return (
    <div className='min-h-screen' style={{ background: '#f8fafc' }}>
      {/* Top header */}
      <div
        className='sticky top-16 md:top-0 z-40 border-b'
        style={{ background: 'white', borderColor: '#e2e8f0' }}
      >
        {/* Gold accent */}
        <div className='h-0.5' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

        <div className='max-w-6xl mx-auto px-4'>
          {/* Back + event name row */}
          <div className='flex items-center gap-3 pt-3 pb-2'>
            <button
              onClick={() => onNavigate('my-events')}
              className='p-1.5 rounded-lg transition-colors hover:bg-slate-100'
              aria-label='Back to My Events'
            >
              <ArrowLeft className='w-4 h-4' style={{ color: '#475569' }} />
            </button>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-semibold uppercase tracking-widest truncate'
                style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
                Event Workspace
              </p>
              <h1 className='text-base font-black truncate leading-tight' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                {event.name}
              </h1>
            </div>
            {isPast && (
              <span className='text-xs font-semibold px-2.5 py-1 rounded-full shrink-0'
                style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontFamily: 'Inter, sans-serif' }}>
                Past event
              </span>
            )}
          </div>

          {/* Tab bar */}
          <div className='flex items-center gap-0.5 overflow-x-auto pb-0 scrollbar-none'>
            {TABS.map(tab => {
              const Icon     = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className='flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all shrink-0'
                  style={{
                    borderColor: isActive ? 'hsl(43,74%,49%)' : 'transparent',
                    color:       isActive ? 'hsl(43,74%,40%)' : '#64748b',
                    fontFamily:  'Inter, sans-serif',
                  }}
                >
                  <Icon className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>{tab.label}</span>
                  <span className='sm:hidden'>{tab.mobileLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <main className='max-w-6xl mx-auto px-4 py-6'>
        {renderTab()}
      </main>

      {showOnboarding && (
        <WorkspaceOnboarding eventId={event.id} onDone={dismissOnboarding} />
      )}
    </div>
  );
}
