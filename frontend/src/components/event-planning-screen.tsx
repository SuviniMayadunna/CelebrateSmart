import { AppScreen, EventData } from '@/App';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, MapPin, CheckCircle2, Store, ShoppingCart } from 'lucide-react';

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
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Quick overview of your plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Event Type</p>
                  <p className='font-semibold text-foreground'>{event.type}</p>
                </div>
                <div>
                  <p className='text-muted-foreground flex items-center gap-2'>
                    <Calendar className='size-4' /> Date
                  </p>
                  <p className='font-semibold text-foreground'>{event.date}</p>
                </div>
                <div>
                  <p className='text-muted-foreground flex items-center gap-2'>
                    <Clock className='size-4' /> Time
                  </p>
                  <p className='font-semibold text-foreground'>{event.time}</p>
                </div>
                <div>
                  <p className='text-muted-foreground flex items-center gap-2'>
                    <MapPin className='size-4' /> Venue
                  </p>
                  <p className='font-semibold text-foreground'>{event.venueBooked || event.venue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader className='flex-row items-center justify-between'>
              <div>
                <CardTitle>Planning Progress</CardTitle>
                <CardDescription>
                  {event.completedTasks.length} of {PLANNING_STEPS.length} tasks completed
                </CardDescription>
              </div>
              <Badge variant={progressPercent === 100 ? 'secondary' : 'outline'}>
                {Math.round(progressPercent)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className='h-3' />
            </CardContent>
          </Card>

          {/* Planning Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Planning Checklist</CardTitle>
              <CardDescription>Complete tasks or browse shop by category.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {PLANNING_STEPS.map((step) => {
                const isCompleted = event.completedTasks.includes(step.id);
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isCompleted
                        ? 'bg-primary/10 border-primary/40'
                        : 'bg-muted/50 border-border hover:border-primary/40'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div className='size-10 rounded-lg bg-background border flex items-center justify-center'>
                          <CheckCircle2 className={`size-5 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h3 className='font-semibold text-lg text-foreground'>{step.name}</h3>
                          <p className='text-sm text-muted-foreground'>
                            {isCompleted ? '✓ Completed' : 'Mark as done or browse shop'}
                          </p>
                        </div>
                      </div>
                      {isCompleted && (
                        <Badge variant='secondary'>Completed</Badge>
                      )}
                    </div>

                    {!isCompleted && (
                      <>
                        <div className='flex flex-col sm:flex-row gap-3 mt-4 sm:pl-14'>
                          <Button
                            onClick={() => {
                              if (step.id === 'venue') {
                                setShowVenueInput(step.id);
                              } else {
                                onCompleteTask(step.id);
                              }
                            }}
                            className='font-semibold'
                          >
                            Already Arranged
                          </Button>
                          <Button
                            onClick={() => onShopWithCategory(step.category)}
                            variant='secondary'
                            className='font-semibold'
                          >
                            <Store className='size-4' />
                            Browse Shop
                          </Button>
                        </div>
                        {showVenueInput === step.id && step.id === 'venue' && (
                          <div className='mt-4 sm:pl-14'>
                            <div className='bg-card border border-border rounded-lg p-4 space-y-3'>
                              <p className='text-sm font-semibold text-foreground'>Enter Venue Name</p>
                              <div className='flex flex-col sm:flex-row gap-2'>
                                <Input
                                  value={customVenue}
                                  onChange={(e) => setCustomVenue(e.target.value)}
                                  placeholder='e.g., Central Park, Grand Hotel…'
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleCustomVenue(step.id);
                                    }
                                  }}
                                />
                                <div className='flex gap-2'>
                                  <Button onClick={() => handleCustomVenue(step.id)} className='font-semibold'>
                                    Confirm
                                  </Button>
                                  <Button
                                    variant='secondary'
                                    onClick={() => {
                                      setShowVenueInput(null);
                                      setCustomVenue('');
                                    }}
                                    className='font-semibold'
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-3'>
            <Button onClick={onShop} variant='secondary' className='w-full sm:flex-1 font-bold' size='lg'>
              <Store className='size-4' />
              Continue Shopping
            </Button>
            <Button onClick={() => onNavigate('cart')} className='w-full sm:flex-1 font-bold' size='lg'>
              <ShoppingCart className='size-4' />
              View Cart
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
