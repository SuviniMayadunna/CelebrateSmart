import { useState } from 'react';
import { AppScreen } from '@/App';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles } from 'lucide-react';

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
    emoji: '🎂',
    description: 'Celebrate a birthday with cake, decorations, and fun',
    steps: ['Cake', 'Decorations', 'Food', 'Entertainment', 'Photography', 'Gifts'],
  },
  {
    id: 'proposal',
    name: 'Proposal',
    emoji: '💍',
    description: 'Plan the perfect proposal moment',
    steps: ['Venue', 'Flowers', 'Decorations', 'Photography', 'Entertainment', 'Celebration Dinner'],
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    emoji: '🍼',
    description: 'Celebrate the upcoming arrival with loved ones',
    steps: ['Cake', 'Decorations', 'Games', 'Food & Drinks', 'Party Favors', 'Gifts'],
  },
  {
    id: 'bride-to-be',
    name: 'Bride-to-Be Party',
    emoji: '👰',
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
            <div className='flex items-center gap-3'>
              <Button variant='ghost' onClick={() => setSelectedTemplate(null)}>
                <ArrowLeft className='size-4' />
                Back
              </Button>
              <div className='min-w-0'>
                <h2 className='text-3xl font-bold text-foreground truncate'>
                  {selectedTemplate.emoji} {selectedTemplate.name}
                </h2>
                <p className='text-muted-foreground'>{selectedTemplate.description}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Planning Steps</CardTitle>
                <CardDescription>We’ll guide you through each step.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex flex-wrap gap-2 mb-6'>
                  {selectedTemplate.steps.map((step) => (
                    <Badge key={step} variant='secondary'>
                      {step}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={() => onNavigate('event-creation', undefined, selectedTemplate.name)}
                  className='w-full font-bold'
                  size='lg'
                >
                  <Sparkles className='size-4' />
                  Select This Template
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className='text-left group'
              >
                <Card className='transition-all hover:shadow-md hover:border-primary/40'>
                  <CardHeader className='flex-row items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <CardTitle className='text-2xl group-hover:text-primary transition-colors truncate'>
                        {template.name}
                      </CardTitle>
                      <CardDescription className='mt-1'>
                        {template.description}
                      </CardDescription>
                    </div>
                    <div className='text-4xl shrink-0'>{template.emoji}</div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {template.steps.slice(0, 3).map((step) => (
                        <Badge key={step} variant='outline'>
                          {step}
                        </Badge>
                      ))}
                      {template.steps.length > 3 && (
                        <Badge variant='outline'>
                          +{template.steps.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
