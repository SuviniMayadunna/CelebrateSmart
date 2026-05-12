import { AppScreen, EventData } from '@/App';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, Clock, MapPin, StickyNote, Sparkles } from 'lucide-react';

interface EventCreationScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onCreate: (event: Omit<EventData, 'id' | 'completedTasks'>) => void;
  preselectedType?: string | null;
}

const createEventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required'),
  type: z.string().trim().min(1, 'Event type is required'),
  date: z.string().trim().min(1, 'Date is required'),
  time: z.string().trim().min(1, 'Time is required'),
  venue: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default(''),
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

export function EventCreationScreen({ onNavigate, onCreate, preselectedType }: EventCreationScreenProps) {
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      type: preselectedType || 'Birthday',
      date: '',
      time: '18:00',
      venue: '',
      notes: '',
    },
    mode: 'onTouched',
  });

  const submit = (values: CreateEventFormValues) => {
    onCreate({
      ...values,
      venue: values.venue?.trim() ? values.venue.trim() : 'To be determined',
      notes: values.notes?.trim() ?? '',
    });
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-3xl mx-auto px-4 py-8'>
        <Card>
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
            <CardDescription>Fill in the basics — you can plan the details next.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Sarah's Birthday Party"
                          autoComplete='off'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Input
                              {...field}
                              readOnly
                              className='bg-muted text-muted-foreground cursor-not-allowed pr-9'
                              title='Event type cannot be changed after template selection'
                            />
                            <Sparkles className='absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                          </div>
                        </FormControl>
                        <FormDescription>Selected from template — cannot be changed.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='date'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <div className='relative'>
                          <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                          <FormControl>
                            <Input
                              type='date'
                              min={today}
                              className='pl-9'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormDescription>Past dates cannot be selected.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='time'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <div className='relative'>
                          <Clock className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                          <FormControl>
                            <Input type='time' className='pl-9' {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='venue'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <div className='relative'>
                          <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                          <FormControl>
                            <Input
                              placeholder='e.g., Central Park Pavilion (or select later)'
                              className='pl-9'
                              autoComplete='off'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormDescription>Leave blank to choose options later.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <div className='relative'>
                        <StickyNote className='absolute left-3 top-3 size-4 text-muted-foreground' />
                        <FormControl>
                          <Textarea
                            rows={4}
                            className='pl-9'
                            placeholder='Any additional notes about your event…'
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex flex-col-reverse sm:flex-row gap-3'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => onNavigate('event-templates')}
                    className='w-full sm:flex-1 font-bold'
                  >
                    Cancel
                  </Button>
                  <Button type='submit' className='w-full sm:flex-1 font-bold'>
                    Create Event
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
