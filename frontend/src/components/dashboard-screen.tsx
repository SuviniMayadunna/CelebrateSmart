import { AppScreen, User, EventData } from '@/App';
import { Calendar, Clock, MapPin, Plus, TrendingUp, PartyPopper, CheckCircle } from 'lucide-react';

interface DashboardScreenProps {
  user: User | null;
  events: EventData[];
  onNavigate: (screen: AppScreen, event?: EventData) => void;
  onLogout: () => void;
}

export function DashboardScreen({ user, events, onNavigate }: DashboardScreenProps) {
  const completedEvents = events.filter(e => e.completedTasks.length > 0).length;
  
  return (
    <div className='min-h-screen'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-4xl font-black text-gray-800 mb-2'>
            Welcome back, {user?.name}!
          </h1>
          <p className='text-gray-600 text-lg'>Let's make your celebrations unforgettable</p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
          {[
            { 
              label: 'Total Events', 
              value: events.length, 
              icon: Calendar,
              gradient: 'from-purple-500 to-purple-600',
              bg: 'bg-purple-100'
            },
            { 
              label: 'In Progress', 
              value: events.length - completedEvents, 
              icon: TrendingUp,
              gradient: 'from-pink-500 to-pink-600',
              bg: 'bg-pink-100'
            },
            { 
              label: 'Completed', 
              value: completedEvents, 
              icon: CheckCircle,
              gradient: 'from-orange-500 to-orange-600',
              bg: 'bg-orange-100'
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.bg} rounded-2xl p-6 border-2 border-white shadow-lg hover:shadow-xl transition-all`}
              >
                <div className='flex items-center justify-between mb-4'>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center`}>
                    <Icon className='w-6 h-6 text-white' />
                  </div>
                </div>
                <p className='text-gray-600 text-sm font-medium mb-1'>{stat.label}</p>
                <p className='text-4xl font-black text-gray-800'>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Events Section */}
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-3xl font-bold text-gray-800'>Your Events</h2>
            <button
              onClick={() => onNavigate('event-templates')}
              className='flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg'
            >
              <Plus className='w-5 h-5' />
              <span>New Event</span>
            </button>
          </div>

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
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className='group bg-white rounded-2xl p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-gray-100 hover:border-purple-300'
                  onClick={() => onNavigate('event-planning', event)}
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
                      <span className='text-sm text-gray-600'>Progress</span>
                      <span className='text-sm font-bold text-purple-600'>
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
