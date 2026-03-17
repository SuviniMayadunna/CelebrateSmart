import { AppScreen, EventData } from '@/App';
import { useState } from 'react';

const PLANNING_STEPS = [
  { id: 'cake', name: 'Cake', emoji: '', category: 'Cakes' },
  { id: 'decorations', name: 'Decorations', emoji: '', category: 'Decorations' },
  { id: 'food', name: 'Food', emoji: '', category: 'Food' },
  { id: 'entertainment', name: 'Entertainment', emoji: '', category: 'Entertainment' },
  { id: 'photography', name: 'Photography', emoji: '', category: 'Photography' },
  { id: 'venue', name: 'Venue Booking', emoji: '', category: 'Venue' },
];

interface EventPlanningScreenProps {
  event: EventData;
  onCompleteTask: (taskId: string, venueDetails?: string) => void;
  onNavigate: (screen: AppScreen) => void;
  onShop: () => void;
  onShopWithCategory: (category: string) => void;
}

export function EventPlanningScreen({ event, onCompleteTask, onNavigate, onShop, onShopWithCategory }: EventPlanningScreenProps) {
  const progressPercent = (event.completedTasks.length / PLANNING_STEPS.length) * 100;
  const [showVenueInput, setShowVenueInput] = useState<string | null>(null);
  const [customVenue, setCustomVenue] = useState('');

  const handleCustomVenue = (stepId: string) => {
    if (customVenue.trim()) {
      onCompleteTask(stepId, customVenue.trim());
      setShowVenueInput(null);
      setCustomVenue('');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-4xl mx-auto px-4 py-8'>
        <div className='space-y-8'>
          {/* Event Details */}
          <div className='bg-card border border-border rounded-lg p-6'>
            <h2 className='text-xl font-bold mb-4'>Event Details</h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <p className='text-muted-foreground'>Event Type</p>
                <p className='font-semibold'>{event.type}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Date</p>
                <p className='font-semibold'>{event.date}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Time</p>
                <p className='font-semibold'>{event.time}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Venue</p>
                <p className='font-semibold'>{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className='bg-card border border-border rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold'>Planning Progress</h2>
              <span className='text-2xl font-bold text-primary'>{Math.round(progressPercent)}%</span>
            </div>
            <div className='w-full bg-muted rounded-full h-4'>
              <div
                className='bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className='text-sm text-muted-foreground mt-3'>{event.completedTasks.length} of {PLANNING_STEPS.length} tasks completed</p>
          </div>

          {/* Planning Checklist */}
          <div className='bg-card border border-border rounded-lg p-6'>
            <h2 className='text-xl font-bold mb-6'>Planning Checklist</h2>
            <div className='space-y-4'>
              {PLANNING_STEPS.map((step) => {
                const isCompleted = event.completedTasks.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCompleted
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted border-border hover:border-primary/50'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <span className='text-3xl'>{step.emoji}</span>
                        <div>
                          <h3 className='font-semibold text-lg'>{step.name}</h3>
                          <p className='text-sm text-muted-foreground'>
                            {isCompleted ? '✓ Completed' : 'Mark as done or browse shop'}
                          </p>
                        </div>
                      </div>
                      {isCompleted && <span className='text-2xl'>✅</span>}
                    </div>

                    {!isCompleted && (
                      <>
                        <div className='flex gap-3 mt-4 pl-16'>
                          <button
                            onClick={() => {
                              if (step.id === 'venue') {
                                setShowVenueInput(step.id);
                              } else {
                                onCompleteTask(step.id);
                              }
                            }}
                            className='flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm'
                          >
                            Already Arranged
                          </button>
                          <button
                            onClick={() => onShopWithCategory(step.category)}
                            className='flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors text-sm'
                          >
                            Browse Shop
                          </button>
                        </div>
                        {showVenueInput === step.id && step.id === 'venue' && (
                          <div className='mt-4 pl-16 pr-4'>
                            <div className='bg-card border border-border rounded-lg p-4 space-y-3'>
                              <label className='block text-sm font-semibold'>Enter Venue Name</label>
                              <div className='flex gap-2'>
                                <input
                                  type='text'
                                  value={customVenue}
                                  onChange={(e) => setCustomVenue(e.target.value)}
                                  placeholder='e.g., Central Park, Grand Hotel...'
                                  className='flex-1 px-3 py-2 border border-border rounded-lg bg-background'
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCustomVenue(step.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleCustomVenue(step.id)}
                                  className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 whitespace-nowrap'
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setShowVenueInput(null);
                                    setCustomVenue('');
                                  }}
                                  className='px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90'
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4'>
            <button
              onClick={onShop}
              className='flex-1 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors text-lg'
            >
              Continue Shopping
            </button>
            <button
              onClick={() => onNavigate('cart')}
              className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg'
            >
              View Cart
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
