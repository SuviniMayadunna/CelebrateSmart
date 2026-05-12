import React from "react"

import { useState } from 'react';
import { AppScreen, EventData } from '@/App';

interface EventCreationScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onCreate: (event: Omit<EventData, 'id' | 'completedTasks'>) => void;
  preselectedType?: string | null;
}

export function EventCreationScreen({ onNavigate, onCreate, preselectedType }: EventCreationScreenProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    name: '',
    type: preselectedType || 'Birthday',
    date: '',
    time: '18:00',
    venue: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.date) {
      onCreate({
        ...formData,
        venue: formData.venue || 'To be determined'
      });
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-3xl mx-auto px-4 py-8'>
        <form onSubmit={handleSubmit} className='space-y-6 bg-card border border-border rounded-lg p-8'>
          <div className='space-y-2'>
            <label className='block font-semibold'>Event Name *</label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Sarah's Birthday Party"
              className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='block font-semibold'>Event Type *</label>
              <input
                type='text'
                name='type'
                value={formData.type}
                readOnly
                className='w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed font-semibold'
                title='Event type cannot be changed after template selection'
              />
              <p className='text-xs text-muted-foreground'>Selected from template - cannot be changed</p>
            </div>

            <div className='space-y-2'>
              <label className='block font-semibold'>Date *</label>
              <input
                type='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                min={today}
                className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                required
              />
              <p className='text-xs text-muted-foreground'>Past dates cannot be selected</p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='block font-semibold'>Time *</label>
              <input
                type='time'
                name='time'
                value={formData.time}
                onChange={handleChange}
                className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='block font-semibold'>Venue</label>
              <input
                type='text'
                name='venue'
                value={formData.venue}
                onChange={handleChange}
                placeholder='e.g., Central Park Pavilion (or select company venue later)'
                className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <p className='text-xs text-muted-foreground'>Leave blank to select company venue options later</p>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block font-semibold'>Notes</label>
            <textarea
              name='notes'
              value={formData.notes}
              onChange={handleChange}
              placeholder='Any additional notes about your event...'
              rows={4}
              className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
            />
          </div>

          <div className='flex gap-4'>
            <button
              type='submit'
              className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
            >
              Create Event
            </button>
            <button
              type='button'
              onClick={() => onNavigate('event-templates')}
              className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
