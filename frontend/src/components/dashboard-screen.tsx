import { AppScreen, User, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, TrendingUp, CheckCircle } from 'lucide-react';
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

export function DashboardScreen({ user, events, onNavigate }: DashboardScreenProps) {
  const completedEvents = events.filter(e => e.completedTasks.length > 0).length;
  
  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-4xl font-black text-foreground mb-2'>
            Welcome back, {user?.name}!
          </h1>
          <p className='text-muted-foreground text-lg'>Let's make your celebrations unforgettable</p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
          {[
            { 
              label: 'Total Events', 
              value: events.length, 
              icon: Calendar,
              gradient: 'from-primary to-secondary',
              bg: 'bg-primary/10'
            },
            { 
              label: 'In Progress', 
              value: events.length - completedEvents, 
              icon: TrendingUp,
              gradient: 'from-secondary to-accent',
              bg: 'bg-secondary/10'
            },
            { 
              label: 'Completed', 
              value: completedEvents, 
              icon: CheckCircle,
              gradient: 'from-accent to-primary',
              bg: 'bg-accent/10'
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all`}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <Icon className='w-6 h-6 text-white' />
                  </div>
                </div>
                <p className='text-muted-foreground text-sm font-medium mb-1'>{stat.label}</p>
                <p className='text-4xl font-black text-foreground'>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Events Section */}
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
                <Button onClick={() => onNavigate('event-templates')} className='font-bold'>
                  <Plus className='w-5 h-5' />
                  <span>Create Your First Event</span>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className='group bg-card rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border border-border hover:border-primary/30'
                  onClick={() => onNavigate('event-planning', event)}
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors'>
                        {event.name}
                      </h3>
                      <p className='text-sm text-muted-foreground capitalize font-medium'>{event.type}</p>
                    </div>
                    <div className='w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-xl'>
                      
                    </div>
                  </div>
                  
                  <div className='space-y-2 mb-4'>
                    <div className='flex items-center space-x-2 text-muted-foreground'>
                      <Calendar className='w-4 h-4' />
                      <span className='text-sm'>{event.date}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-muted-foreground'>
                      <Clock className='w-4 h-4' />
                      <span className='text-sm'>{event.time}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-muted-foreground'>
                      <MapPin className='w-4 h-4' />
                      <span className='text-sm'>{event.venue}</span>
                    </div>
                  </div>
                  
                  <div className='pt-4 border-t border-gray-100'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>Progress</span>
                      <span className='text-sm font-bold text-primary'>
                        {event.completedTasks.length} tasks done
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
