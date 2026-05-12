import { AppScreen, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, CheckCircle } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

interface MyEventsScreenProps {
  events: EventData[];
  onNavigate: (screen: AppScreen, event?: EventData) => void;
}

export function MyEventsScreen({ events, onNavigate }: MyEventsScreenProps) {
  const TOTAL_PLANNING_STEPS = 6; // Total number of planning tasks

  const handleEventClick = (event: EventData) => {
    // If all tasks are completed, show the event plan viewer
    if (event.completedTasks.length === TOTAL_PLANNING_STEPS) {
      onNavigate('event-plan-viewer', event);
    } else {
      // Otherwise, continue with event planning
      onNavigate('event-planning', event);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-8'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-black text-foreground mb-2'>My Events</h1>
              <p className='text-muted-foreground text-lg'>Manage your celebrations</p>
            </div>
            <Button onClick={() => onNavigate('event-templates')} className='font-bold'>
              <Plus className='w-5 h-5' />
              <span>New Event</span>
            </Button>
          </div>

          {/* Events Grid */}
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
              {events.map((event) => {
                const isCompleted = event.completedTasks.length === TOTAL_PLANNING_STEPS;
                return (
                  <div 
                    key={event.id} 
                    className={`group bg-card rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer border ${
                      isCompleted 
                        ? 'border-green-300 hover:border-green-500' 
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => handleEventClick(event)}
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
                      <span className='text-sm text-muted-foreground'>
                        {isCompleted ? 'Status' : 'Progress'}
                      </span>
                      <span className={`text-sm font-bold ${
                        isCompleted 
                          ? 'text-green-600 flex items-center gap-1' 
                          : 'text-primary'
                      }`}>
                        {isCompleted ? (
                          <>
                            <CheckCircle className='w-4 h-4' />
                            Completed
                          </>
                        ) : (
                          `${event.completedTasks.length} tasks done`
                        )}
                      </span>
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
