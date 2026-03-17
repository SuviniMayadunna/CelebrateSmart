import { AppScreen, EventData } from '@/App';
import { Download, Printer, Calendar, Clock, MapPin, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface EventPlanViewerProps {
  event: EventData;
  onNavigate: (screen: AppScreen) => void;
}

export function EventPlanViewer({ event, onNavigate }: EventPlanViewerProps) {
  const orderId = Math.random().toString(36).substring(7).toUpperCase();

  // Get event-specific content
  const getEventTypeConfig = (eventType: string) => {
    const type = eventType.toLowerCase();
    
    if (type.includes('birthday')) {
      return {
        icon: '',
        color: 'from-pink-500 to-purple-500',
        timeline: [
          {
            time: -2,
            title: 'Setup & Birthday Decoration',
            tasks: [
              'Arrive at venue and set up birthday decorations',
              'Hang banners, balloons, and birthday signs',
              'Set up photo booth area with props',
              'Arrange cake table and gift area',
              'Test music system for birthday playlist'
            ]
          },
          {
            time: -1,
            title: 'Final Birthday Preparations',
            tasks: [
              'Display birthday cake prominently',
              'Set up food and beverage stations',
              'Prepare party favors and goody bags',
              'Arrange seating for guests',
              'Final check of decorations and lighting'
            ]
          },
          {
            time: 0,
            title: 'Guest Arrival & Welcome',
            tasks: [
              'Welcome birthday guests at entrance',
              'Guide guests to gift table',
              'Serve welcome drinks and snacks',
              'Play background music',
              'Informal mingling and photo opportunities'
            ]
          },
          {
            time: 1,
            title: 'Birthday Activities Begin',
            tasks: [
              'Welcome speech by host',
              'Party games and activities',
              'Entertainment performance',
              'Photo session with birthday person',
              'Special birthday surprises'
            ]
          },
          {
            time: 2,
            title: 'Cake Cutting & Celebration',
            tasks: [
              'Birthday song and cake cutting ceremony',
              'Serve birthday cake to all guests',
              'Main meal service',
              'Continue games and entertainment',
              'Gift opening session (if planned)'
            ]
          },
          {
            time: 3,
            title: 'Party Wind Down',
            tasks: [
              'Last round of photos',
              'Distribute party favors',
              'Thank you speech',
              'Guest departure',
              'Begin cleanup'
            ]
          }
        ],
        setupInstructions: [
          {
            title: 'Birthday Decorations',
            color: 'yellow',
            items: [
              'Hang "Happy Birthday" banner prominently',
              'Create balloon arches and bouquets',
              'Set up themed decorations matching party theme',
              'Arrange photo backdrop for memorable pictures'
            ]
          },
          {
            title: 'Cake & Food Station',
            color: 'green',
            items: [
              'Position cake table as focal point',
              'Arrange food buffet with clear labels',
              'Set up separate kids and adults food sections if needed',
              'Ensure proper utensils and plates'
            ]
          },
          {
            title: 'Entertainment Zone',
            color: 'blue',
            items: [
              'Set up games and activity areas',
              'Prepare music playlist with birthday favorites',
              'Arrange seating for entertainment viewing',
              'Set up any special performances or acts'
            ]
          }
        ]
      };
    } else if (type.includes('wedding')) {
      return {
        icon: '💒',
        color: 'from-rose-500 to-pink-500',
        timeline: [
          {
            time: -3,
            title: 'Venue Setup & Decoration',
            tasks: [
              'Venue access and initial setup',
              'Arrange ceremony seating (bride & groom sides)',
              'Set up wedding arch/mandap decoration',
              'Install floral arrangements',
              'Set up sound system for ceremony'
            ]
          },
          {
            time: -2,
            title: 'Reception Area Preparation',
            tasks: [
              'Arrange reception tables with centerpieces',
              'Set up head table for bride and groom',
              'Install lighting and ambiance',
              'Set up gift table and guest book station',
              'Final decoration touches'
            ]
          },
          {
            time: -1,
            title: 'Final Preparations',
            tasks: [
              'Coordinate with bridal party',
              'Set up food and beverage service',
              'Test all audio/visual equipment',
              'Brief all vendors on timeline',
              'Final walkthrough with wedding planner'
            ]
          },
          {
            time: 0,
            title: 'Ceremony Begins',
            tasks: [
              'Guest seating and welcome',
              'Processional music starts',
              'Wedding ceremony proceedings',
              'Exchange of vows and rings',
              'Recessional and photo session'
            ]
          },
          {
            time: 1.5,
            title: 'Cocktail Hour',
            tasks: [
              'Serve drinks and hors d\'oeuvres',
              'Couple photos with photographer',
              'Guest mingling and networking',
              'Background music',
              'Transition guests to reception'
            ]
          },
          {
            time: 2.5,
            title: 'Reception & Dinner',
            tasks: [
              'Grand entrance of bride and groom',
              'First dance and parent dances',
              'Dinner service begins',
              'Toasts and speeches',
              'Cake cutting ceremony'
            ]
          },
          {
            time: 4,
            title: 'Dancing & Celebration',
            tasks: [
              'Open dance floor',
              'Bouquet and garter toss',
              'Special dances and performances',
              'Photo booth activities',
              'Continue celebration'
            ]
          },
          {
            time: 5,
            title: 'Send-Off',
            tasks: [
              'Last dance',
              'Grand exit preparation',
              'Distribute sparklers/confetti',
              'Farewell photos',
              'Couple departure'
            ]
          }
        ],
        setupInstructions: [
          {
            title: 'Ceremony Area',
            color: 'yellow',
            items: [
              'Position wedding arch/mandap as focal point',
              'Arrange chairs in traditional layout',
              'Decorate aisle with petals or runners',
              'Set up microphones for vows',
              'Arrange family seating in front rows'
            ]
          },
          {
            title: 'Reception Setup',
            color: 'green',
            items: [
              'Arrange tables with elegant centerpieces',
              'Set up head table with special decorations',
              'Position dance floor centrally',
              'Install uplighting and mood lighting',
              'Set up DJ/band equipment'
            ]
          },
          {
            title: 'Food & Bar Service',
            color: 'blue',
            items: [
              'Set up catering stations or plated service',
              'Position wedding cake table prominently',
              'Set up bar with signage',
              'Ensure dietary options are labeled',
              'Coordinate with catering staff'
            ]
          }
        ]
      };
    } else if (type.includes('party')) {
      return {
        icon: '🎉',
        color: 'from-orange-500 to-red-500',
        timeline: [
          {
            time: -2,
            title: 'Party Setup',
            tasks: [
              'Arrive at venue and set up party space',
              'Install party decorations and lighting',
              'Set up DJ/music equipment',
              'Arrange seating and mingling areas',
              'Set up bar and beverage station'
            ]
          },
          {
            time: -1,
            title: 'Final Party Preparations',
            tasks: [
              'Display food and appetizers',
              'Test sound system and lighting',
              'Set up photo areas',
              'Brief staff and bartenders',
              'Final walkthrough'
            ]
          },
          {
            time: 0,
            title: 'Party Starts - Guest Arrival',
            tasks: [
              'Welcome guests at entrance',
              'Coat check and bag storage',
              'Serve welcome drinks',
              'Background music playing',
              'Guests mingling and socializing'
            ]
          },
          {
            time: 1,
            title: 'Main Party Activities',
            tasks: [
              'Welcome announcement by host',
              'Main entertainment begins',
              'Dance floor opens',
              'Interactive games or activities',
              'Photo booth operations'
            ]
          },
          {
            time: 2,
            title: 'Peak Party Time',
            tasks: [
              'Main food service',
              'Full dance floor activity',
              'Special performances or acts',
              'Contests or party games',
              'Continuous entertainment'
            ]
          },
          {
            time: 3.5,
            title: 'Party Wind Down',
            tasks: [
              'Last call for drinks',
              'Final songs and dances',
              'Thank you from host',
              'Guest departure',
              'Begin cleanup'
            ]
          }
        ],
        setupInstructions: [
          {
            title: 'Party Atmosphere',
            color: 'yellow',
            items: [
              'Install colorful party decorations',
              'Set up disco ball and party lighting',
              'Create multiple social zones',
              'Arrange photo booth with props',
              'Set up themed decoration elements'
            ]
          },
          {
            title: 'Entertainment Zone',
            color: 'green',
            items: [
              'Position DJ booth prominently',
              'Set up dance floor with lighting',
              'Arrange karaoke setup if planned',
              'Create game stations',
              'Set up video screens if needed'
            ]
          },
          {
            title: 'Food & Drink Stations',
            color: 'blue',
            items: [
              'Set up bar with variety of drinks',
              'Arrange appetizer and food stations',
              'Position dessert table attractively',
              'Ensure easy access to all stations',
              'Stock plenty of ice and glassware'
            ]
          }
        ]
      };
    } else {
      // Default/Other events
      return {
        icon: '🎊',
        color: 'from-blue-500 to-purple-500',
        timeline: [
          {
            time: -2,
            title: 'Event Setup',
            tasks: [
              'Arrive at venue and confirm access',
              'Set up decorations and signage',
              'Arrange seating and tables',
              'Test audio/visual equipment',
              'Coordinate with vendors'
            ]
          },
          {
            time: -1,
            title: 'Final Preparations',
            tasks: [
              'Display food and beverages',
              'Set up registration/check-in area',
              'Final walkthrough',
              'Brief staff on responsibilities',
              'Test all equipment'
            ]
          },
          {
            time: 0,
            title: 'Event Begins',
            tasks: [
              'Welcome guests at entrance',
              'Registration and check-in',
              'Serve welcome refreshments',
              'Background entertainment',
              'Networking and mingling'
            ]
          },
          {
            time: 1,
            title: 'Main Program',
            tasks: [
              'Opening remarks',
              'Main activities begin',
              'Scheduled presentations',
              'Interactive sessions',
              'Photo opportunities'
            ]
          },
          {
            time: 2,
            title: 'Core Activities',
            tasks: [
              'Main meal or refreshments',
              'Continued program activities',
              'Entertainment segments',
              'Special moments or announcements',
              'Audience participation'
            ]
          },
          {
            time: 3,
            title: 'Event Conclusion',
            tasks: [
              'Closing remarks',
              'Final photos',
              'Thank you to attendees',
              'Guest departure',
              'Begin cleanup'
            ]
          }
        ],
        setupInstructions: [
          {
            title: 'Event Space',
            color: 'yellow',
            items: [
              'Arrange decorations appropriately',
              'Set up signage and directions',
              'Create welcoming atmosphere',
              'Ensure proper lighting'
            ]
          },
          {
            title: 'Guest Services',
            color: 'green',
            items: [
              'Set up registration table',
              'Arrange seating comfortably',
              'Display refreshments',
              'Prepare information materials'
            ]
          },
          {
            title: 'Technical Setup',
            color: 'blue',
            items: [
              'Test microphones and speakers',
              'Set up projection if needed',
              'Check internet connectivity',
              'Prepare backup equipment'
            ]
          }
        ]
      };
    }
  };

  const eventConfig = getEventTypeConfig(event.type);

  const handleDownloadPlan = () => {
    const planContent = generateEventPlanContent(event);
    const blob = new Blob([planContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, '_')}_Event_Plan.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPlan = () => {
    window.print();
  };

  const calculateTimeOffset = (timeStr: string, hoursOffset: number): string => {
    try {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      hours += hoursOffset;
      
      if (hours < 0) hours += 24;
      if (hours >= 24) hours -= 24;
      
      const newPeriod = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${newPeriod}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 px-4 py-8'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6'>
          <div className='flex-1'>
            <div className='flex items-center gap-4 mb-2'>
              <button
                onClick={() => onNavigate('my-events')}
                className='p-2 hover:bg-white/20 rounded-lg transition-colors no-print'
              >
                <ArrowLeft className='w-5 h-5' />
              </button>
              <div>
                <h1 className='text-3xl font-bold'>{event.name} - Event Plan</h1>
                <p className='text-white/90 mt-1 text-lg'>
                  <span className='capitalize font-semibold'>{event.type}</span>
                  <span className='opacity-75'> - Professional Event Planning Document</span>
                </p>
              </div>
            </div>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={handlePrintPlan}
              className='inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-all border-2 border-white no-print'
            >
              <Printer className='w-5 h-5' />
              Print
            </button>
            <button
              onClick={handleDownloadPlan}
              className='inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg no-print'
            >
              <Download className='w-5 h-5' />
              Download
            </button>
          </div>
        </div>

        {/* Event Plan Content */}
        <div className='bg-white rounded-lg shadow-lg p-8 space-y-8'>
          {/* Event Overview */}
          <section className='border-b pb-6'>
            <h2 className='text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2'>
              📋 Event Overview
            </h2>
            <div className='mb-4 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg border-2 border-purple-200'>
              <div>
                <p className='text-white text-sm font-semibold mb-1 opacity-90'>Event Type</p>
                <p className='text-white text-3xl font-bold capitalize'>{event.type} Event</p>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='bg-purple-50 p-4 rounded-lg'>
                <div className='flex items-center gap-2 text-purple-600 mb-2'>
                  <Calendar className='w-5 h-5' />
                  <span className='font-bold'>Date</span>
                </div>
                <p className='text-lg'>{event.date}</p>
              </div>
              <div className='bg-pink-50 p-4 rounded-lg'>
                <div className='flex items-center gap-2 text-pink-600 mb-2'>
                  <Clock className='w-5 h-5' />
                  <span className='font-bold'>Time</span>
                </div>
                <p className='text-lg'>{event.time}</p>
              </div>
              <div className='bg-orange-50 p-4 rounded-lg'>
                <div className='flex items-center gap-2 text-orange-600 mb-2'>
                  <MapPin className='w-5 h-5' />
                  <span className='font-bold'>Venue</span>
                </div>
                <p className='text-lg'>{event.venueBooked || event.venue}</p>
              </div>
            </div>
            <div className='mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                <p className='font-bold text-green-900'>Event Planning Complete!</p>
              </div>
              <p className='text-green-800 text-sm mt-1'>All {event.completedTasks.length} planning tasks have been completed.</p>
            </div>
            {event.notes && (
              <div className='mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded'>
                <p className='font-bold text-yellow-800'>Special Notes:</p>
                <p className='text-yellow-900'>{event.notes}</p>
              </div>
            )}
          </section>

          {/* Event Day Timeline */}
          <section className='border-b pb-6'>
            <h2 className='text-2xl font-bold text-purple-600 mb-4'>⏰ Event Day Timeline</h2>
            <div className='space-y-4'>
              {eventConfig.timeline.map((item, index) => (
                <TimelineItem 
                  key={index}
                  time={calculateTimeOffset(event.time, item.time)}
                  title={item.title}
                  tasks={item.tasks}
                  highlight={item.time === 0}
                />
              ))}
            </div>
          </section>

          {/* Completed Tasks */}
          <section className='border-b pb-6'>
            <h2 className='text-2xl font-bold text-purple-600 mb-4'>✅ Completed Planning Tasks</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {event.completedTasks.map((task) => (
                <div key={task} className='p-4 bg-green-50 border-l-4 border-green-500 rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-6 h-6 text-green-600 flex-shrink-0' />
                    <span className='font-semibold text-green-900 capitalize'>{task} Arrangements</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Important Contacts */}
          <section className='border-b pb-6'>
            <h2 className='text-2xl font-bold text-purple-600 mb-4'>📞 Important Contacts</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-blue-50 rounded-lg'>
                <p className='font-bold text-blue-900'>Venue</p>
                <p className='text-blue-800'>{event.venue}</p>
                <p className='text-sm text-blue-600 mt-1'>Call ahead to confirm setup times</p>
              </div>
              <div className='p-4 bg-green-50 rounded-lg'>
                <p className='font-bold text-green-900'>CelebrateSmart Support</p>
                <p className='text-green-800'>support@celebratesmart.com</p>
                <p className='text-sm text-green-600 mt-1'>1-800-CELEBRATE</p>
              </div>
              <div className='p-4 bg-red-50 rounded-lg'>
                <p className='font-bold text-red-900'>Emergency Services</p>
                <p className='text-red-800'>911</p>
                <p className='text-sm text-red-600 mt-1'>For any emergencies</p>
              </div>
              <div className='p-4 bg-purple-50 rounded-lg'>
                <p className='font-bold text-purple-900'>Event Reference</p>
                <p className='text-purple-800'>{orderId}</p>
                <p className='text-sm text-purple-600 mt-1'>Quote for inquiries</p>
              </div>
            </div>
          </section>

          {/* Setup Instructions */}
          <section className='border-b pb-6'>
            <h2 className='text-2xl font-bold text-purple-600 mb-4'>📦 Setup Instructions</h2>
            <div className='space-y-4'>
              {eventConfig.setupInstructions.map((section, index) => (
                <div key={index} className={`p-4 bg-${section.color}-50 border-l-4 border-${section.color}-400 rounded`}>
                  <p className={`font-bold text-${section.color}-900 mb-2`}>{section.title}</p>
                  <ul className={`list-disc list-inside text-${section.color}-800 space-y-1`}>
                    {section.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency Info */}
          <section>
            <div className='p-6 bg-orange-50 border-2 border-orange-300 rounded-lg'>
              <h3 className='font-bold text-orange-900 text-xl mb-3 flex items-center gap-2'>
                <AlertCircle className='w-6 h-6' />
                Emergency Preparedness
              </h3>
              <ul className='space-y-2 text-orange-800'>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                  <span>First aid kit with event coordinator</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                  <span>Emergency exits clearly marked and accessible</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                  <span>Backup contact numbers readily available</span>
                </li>
                <li className='flex items-start gap-2'>
                  <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                  <span>Weather contingency plan prepared if outdoor event</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className='mt-8 pt-6 border-t-2 border-purple-200 text-center text-gray-600'>
            <p className='font-bold text-purple-600 text-lg'>CelebrateSmart Event Planning</p>
            <p className='text-sm mt-1'>Making your celebrations unforgettable</p>
            <p className='text-xs mt-2'>Generated on {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className='flex flex-col sm:flex-row gap-4 no-print'>
          <button
            onClick={() => onNavigate('my-events')}
            className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
          >
            Back to My Events
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Component
function TimelineItem({ time, title, tasks, highlight = false }: { time: string; title: string; tasks: string[]; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border-l-4 ${highlight ? 'bg-pink-50 border-pink-500' : 'bg-purple-50 border-purple-500'}`}>
      <div className='flex items-center gap-3 mb-2'>
        <Clock className={`w-5 h-5 ${highlight ? 'text-pink-600' : 'text-purple-600'}`} />
        <span className={`font-bold text-lg ${highlight ? 'text-pink-900' : 'text-purple-900'}`}>{time}</span>
      </div>
      <p className='font-semibold text-gray-800 mb-2'>{title}</p>
      <ul className='space-y-1 text-sm text-gray-700'>
        {tasks.map((task, idx) => (
          <li key={idx} className='flex items-start gap-2'>
            <span className='text-gray-400'>•</span>
            <span>{task}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Generate HTML content for download
function generateEventPlanContent(event: EventData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${event.name} - Event Plan</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #9333EA; padding-bottom: 20px; }
    .header h1 { color: #9333EA; margin: 0; font-size: 36px; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h2 { color: #9333EA; border-bottom: 2px solid #EC4899; padding-bottom: 10px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
    .info-item { background: #F3E8FF; padding: 15px; border-radius: 8px; }
    .timeline-item { margin: 15px 0; padding: 15px; background: #FFF1F2; border-left: 4px solid #EC4899; }
    .completed-task { padding: 10px; margin: 5px 0; background: #F0FDF4; border-left: 4px solid #10B981; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${event.name}</h1>
    <p style="font-size: 20px; color: #9333EA;">EVENT PLAN</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="section">
    <h2>Event Overview</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Date:</strong> ${event.date}</div>
      <div class="info-item"><strong>Time:</strong> ${event.time}</div>
      <div class="info-item"><strong>Venue:</strong> ${event.venueBooked || event.venue}</div>
    </div>
  </div>
  <div class="section">
    <h2>Completed Tasks</h2>
    ${event.completedTasks.map(task => `<div class="completed-task">${task.charAt(0).toUpperCase() + task.slice(1)} Arrangements</div>`).join('')}
  </div>
  <div style="margin-top: 50px; text-align: center; color: #666;">
    <p><strong>CelebrateSmart Event Planning</strong></p>
    <p>Making your celebrations unforgettable</p>
  </div>
</body>
</html>
  `.trim();
}
