import { useState } from 'react';
import { AppScreen } from '@/app/page';

interface EventTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  steps: string[];
}

interface EventTemplateScreenProps {
  onNavigate: (screen: AppScreen, event?: any, eventType?: string) => void;
}

const TEMPLATES: EventTemplate[] = [
  {
    id: 'birthday',
    name: 'Birthday Party',
    emoji: '',
    description: 'Celebrate a birthday with cake, decorations, and fun',
    steps: ['Cake', 'Decorations', 'Food', 'Entertainment', 'Photography', 'Gifts'],
  },
  {
    id: 'proposal',
    name: 'Proposal',
    emoji: '',
    description: 'Plan the perfect proposal moment',
    steps: ['Venue', 'Flowers', 'Decorations', 'Photography', 'Entertainment', 'Celebration Dinner'],
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    emoji: '',
    description: 'Celebrate the upcoming arrival with loved ones',
    steps: ['Cake', 'Decorations', 'Games', 'Food & Drinks', 'Party Favors', 'Gifts'],
  },
  {
    id: 'bride-to-be',
    name: 'Bride-to-Be Party',
    emoji: '',
    description: 'Celebrate the bride before the big day',
    steps: ['Cake', 'Decorations', 'Games & Activities', 'Food', 'Entertainment', 'Gifts'],
  },
];

export function EventTemplateScreen({ onNavigate }: EventTemplateScreenProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {selectedTemplate ? (
          <div className='space-y-6'>
            <div className='flex items-center gap-4 mb-6'>
              <button
                onClick={() => setSelectedTemplate(null)}
                className='text-2xl hover:scale-110 transition-transform'
              >
                ←
              </button>
              <h2 className='text-3xl font-bold'>{selectedTemplate.emoji} {selectedTemplate.name}</h2>
            </div>

            <div className='bg-card border border-border rounded-lg p-8'>
              <p className='text-lg text-muted-foreground mb-6'>{selectedTemplate.description}</p>
              
              <div className='mb-8'>
                <h3 className='text-lg font-semibold mb-4'>Planning Steps:</h3>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                  {selectedTemplate.steps.map((step) => (
                    <div key={step} className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
                      <span className='font-medium'>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('event-creation', undefined, selectedTemplate.name)}
                className='w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-lg'
              >
                Select This Template
              </button>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className='text-left bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group'
              >
                <div className='flex items-start justify-between mb-4'>
                  <h3 className='text-2xl font-bold group-hover:text-primary transition-colors'>{template.name}</h3>
                  <span className='text-4xl'>{template.emoji}</span>
                </div>
                <p className='text-muted-foreground mb-4'>{template.description}</p>
                <div className='flex flex-wrap gap-2'>
                  {template.steps.slice(0, 3).map((step) => (
                    <span key={step} className='px-3 py-1 bg-muted text-sm rounded-full'>
                      {step}
                    </span>
                  ))}
                  {template.steps.length > 3 && (
                    <span className='px-3 py-1 bg-muted text-sm rounded-full'>
                      +{template.steps.length - 3} more
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
