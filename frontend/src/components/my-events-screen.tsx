import { AppScreen, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, CheckCircle } from 'lucide-react';

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
              <h1 className='text-4xl font-black text-gray-800 mb-2'>My Events</h1>
              <p className='text-gray-600 text-lg'>Manage your celebrations</p>
            </div>
            <button
              onClick={() => onNavigate('event-templates')}
              className='inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg'
            >
              <Plus className='w-5 h-5' />
              <span>New Event</span>
            </button>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className='text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300'>
              <h3 className='text-xl font-bold text-gray-800 mb-2'>No events yet</h3>
              <p className='text-gray-600 mb-6'>Start planning your first celebration!</p>
              <button
                onClick={() => onNavigate('event-templates')}
                className='inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all'
              >
                <Plus className='w-5 h-5' />
                <span>Create Your First Event</span>
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {events.map((event) => {
                const isCompleted = event.completedTasks.length === TOTAL_PLANNING_STEPS;
                return (
                  <div 
                    key={event.id} 
                    className={`group bg-white rounded-2xl p-6 hover:shadow-2xl transition-all cursor-pointer border-2 ${
                      isCompleted 
                        ? 'border-green-300 hover:border-green-500' 
                        : 'border-gray-100 hover:border-purple-300'
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors'>
                        {event.name}
                      </h3>
                      <p className='text-sm text-gray-500 capitalize font-medium'>{event.type}</p>
                    </div>
                    <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl'>
                      
                    </div>
                  </div>
                  
                  <div className='space-y-2 mb-4'>
                    <div className='flex items-center space-x-2 text-gray-600'>
                      <Calendar className='w-4 h-4' />
                      <span className='text-sm'>{event.date}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-gray-600'>
                      <Clock className='w-4 h-4' />
                      <span className='text-sm'>{event.time}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-gray-600'>
                      <MapPin className='w-4 h-4' />
                      <span className='text-sm'>{event.venue}</span>
                    </div>
                  </div>
                  
                  <div className='pt-4 border-t border-gray-100'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        {isCompleted ? 'Status' : 'Progress'}
                      </span>
                      <span className={`text-sm font-bold ${
                        isCompleted 
                          ? 'text-green-600 flex items-center gap-1' 
                          : 'text-purple-600'
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
