import { AppScreen, CartItem, EventData } from '@/App';
import { useState } from 'react';
import { Download, Printer, Calendar, Clock, MapPin, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

interface ConfirmationScreenProps {
  onNavigate: (screen: AppScreen) => void;
  cart: CartItem[];
  event: EventData | null;
}

export function ConfirmationScreen({ onNavigate, cart, event }: ConfirmationScreenProps) {
  const [showEventPlan, setShowEventPlan] = useState(false);
  const orderId = Math.random().toString(36).substring(7).toUpperCase();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleDownloadPlan = () => {
    if (!event) return;
    
    const planContent = generateEventPlanContent();
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

  const generateEventPlanContent = () => {
    if (!event) return '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${event.name} - Event Plan</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #9333EA; padding-bottom: 20px; }
    .header h1 { color: #9333EA; margin: 0; font-size: 36px; }
    .header p { color: #666; margin: 10px 0; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section h2 { color: #9333EA; border-bottom: 2px solid #EC4899; padding-bottom: 10px; margin-bottom: 15px; }
    .section h3 { color: #EC4899; margin-top: 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .info-item { background: #F3E8FF; padding: 15px; border-radius: 8px; }
    .info-item label { font-weight: bold; color: #9333EA; display: block; margin-bottom: 5px; }
    .timeline { margin: 20px 0; }
    .timeline-item { margin: 15px 0; padding: 15px; background: #FFF1F2; border-left: 4px solid #EC4899; }
    .timeline-item .time { font-weight: bold; color: #EC4899; font-size: 18px; }
    .checklist { list-style: none; padding: 0; }
    .checklist li { padding: 10px; margin: 5px 0; background: #F0FDF4; border-left: 4px solid #10B981; }
    .budget-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .budget-table th, .budget-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .budget-table th { background: #9333EA; color: white; }
    .budget-table tfoot td { font-weight: bold; background: #F3E8FF; }
    .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${event.name}</h1>
    <p style="font-size: 20px; color: #9333EA; font-weight: bold;">${event.type.toUpperCase()} EVENT PLAN</p>
    <p>Order ID: ${orderId} | Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="section">
    <h2>📋 Event Overview</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Event Name</label>
        <div>${event.name}</div>
      </div>
      <div class="info-item">
        <label>Event Type</label>
        <div>${event.type}</div>
      </div>
      <div class="info-item">
        <label>Date</label>
        <div>${event.date}</div>
      </div>
      <div class="info-item">
        <label>Time</label>
        <div>${event.time}</div>
      </div>
      <div class="info-item">
        <label>Venue</label>
        <div>${event.venue}</div>
      </div>
      <div class="info-item">
        <label>Status</label>
        <div style="color: #10B981; font-weight: bold;">✓ Confirmed & Paid</div>
      </div>
    </div>
    ${event.notes ? `<div class="info-item" style="margin-top: 15px;"><label>Special Notes</label><div>${event.notes}</div></div>` : ''}
  </div>

  <div class="section">
    <h2>⏰ Event Day Timeline</h2>
    <div class="timeline">
      <div class="timeline-item">
        <div class="time">2 Hours Before (${calculateTimeOffset(event.time, -2)})</div>
        <strong>Setup & Preparation</strong>
        <ul>
          <li>Arrive at venue and confirm access</li>
          <li>Set up decorations and signage</li>
          <li>Arrange tables, chairs, and centerpieces</li>
          <li>Test audio/visual equipment</li>
          <li>Coordinate with vendors for deliveries</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">1 Hour Before (${calculateTimeOffset(event.time, -1)})</div>
        <strong>Final Preparations</strong>
        <ul>
          <li>Display food and beverages</li>
          <li>Set up gift/registration table</li>
          <li>Conduct final walkthrough</li>
          <li>Brief staff/volunteers on their roles</li>
          <li>Test lighting and music</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">${event.time}</div>
        <strong>Event Start - Guest Arrival</strong>
        <ul>
          <li>Welcome guests at entrance</li>
          <li>Direct guests to registration/gift area</li>
          <li>Serve welcome drinks/appetizers</li>
          <li>Background music playing</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">30 Minutes After Start (${calculateTimeOffset(event.time, 0.5)})</div>
        <strong>Main Activities Begin</strong>
        <ul>
          <li>Opening remarks/welcome speech</li>
          <li>Main entertainment begins</li>
          <li>Photo opportunities with photographer</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">Mid-Event</div>
        <strong>Food Service & Entertainment</strong>
        <ul>
          <li>Serve main food/cake</li>
          <li>Scheduled performances or activities</li>
          <li>Games or interactive segments</li>
          <li>Special moments (toasts, speeches, etc.)</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">Final Hour</div>
        <strong>Wrap-Up & Farewell</strong>
        <ul>
          <li>Last call for photos</li>
          <li>Thank you speech/closing remarks</li>
          <li>Distribute party favors/thank you gifts</li>
          <li>Guest departure</li>
        </ul>
      </div>
      <div class="timeline-item">
        <div class="time">After Event</div>
        <strong>Cleanup & Breakdown</strong>
        <ul>
          <li>Collect personal items and decorations</li>
          <li>Coordinate vendor pickup</li>
          <li>Clean and restore venue</li>
          <li>Secure leftover items</li>
          <li>Final venue inspection</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>✅ Complete Planning Checklist</h2>
    <h3>One Month Before:</h3>
    <ul class="checklist">
      <li>✓ Finalize guest list</li>
      <li>✓ Send invitations</li>
      <li>✓ Book venue</li>
      <li>✓ Hire vendors (catering, photography, entertainment)</li>
      <li>✓ Order decorations and supplies</li>
    </ul>
    
    <h3>Two Weeks Before:</h3>
    <ul class="checklist">
      <li>✓ Confirm vendor bookings</li>
      <li>✓ Finalize menu and dietary requirements</li>
      <li>✓ Plan seating arrangements</li>
      <li>✓ Prepare event timeline</li>
      <li>✓ Order cake/desserts</li>
    </ul>
    
    <h3>One Week Before:</h3>
    <ul class="checklist">
      <li>✓ Confirm RSVP count</li>
      <li>✓ Final venue walkthrough</li>
      <li>✓ Create day-of timeline</li>
      <li>✓ Prepare welcome/thank you speeches</li>
      <li>✓ Purchase last-minute supplies</li>
    </ul>
    
    <h3>Day Before:</h3>
    <ul class="checklist">
      <li>✓ Pack all event materials</li>
      <li>✓ Confirm all vendor arrival times</li>
      <li>✓ Charge all devices (camera, speakers, etc.)</li>
      <li>✓ Prepare emergency kit</li>
      <li>✓ Review timeline with team</li>
    </ul>
    
    <h3>Event Day - Completed:</h3>
    <ul class="checklist">
      ${event.completedTasks.map(task => `<li>✓ ${task.charAt(0).toUpperCase() + task.slice(1)} arrangements finalized</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>💰 Budget Breakdown</h2>
    <table class="budget-table">
      <thead>
        <tr>
          <th>Item/Service</th>
          <th>Category</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map(item => `
          <tr>
            <td>${item.image} ${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4">Subtotal</td>
          <td>$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="4">Tax (10%)</td>
          <td>$${tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="4" style="font-size: 18px;">TOTAL PAID</td>
          <td style="font-size: 18px; color: #9333EA;">$${total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="section">
    <h2>📞 Important Contacts</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>Venue Contact</label>
        <div>${event.venue}</div>
        <div style="color: #666; font-size: 14px;">Call ahead to confirm setup times</div>
      </div>
      <div class="info-item">
        <label>CelebrateSmart Support</label>
        <div>support@celebratesmart.com</div>
        <div style="color: #666; font-size: 14px;">1-800-CELEBRATE</div>
      </div>
      <div class="info-item">
        <label>Emergency Services</label>
        <div>911</div>
        <div style="color: #666; font-size: 14px;">For any emergencies during event</div>
      </div>
      <div class="info-item">
        <label>Order Reference</label>
        <div>${orderId}</div>
        <div style="color: #666; font-size: 14px;">Quote this for any inquiries</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🎯 Day-Of Coordinator Instructions</h2>
    <h3>Coordinator Responsibilities:</h3>
    <ul style="line-height: 2;">
      <li><strong>Arrive Early:</strong> Be at venue 2-3 hours before event start</li>
      <li><strong>Vendor Management:</strong> Greet and direct all vendors to appropriate areas</li>
      <li><strong>Setup Oversight:</strong> Ensure all decorations, seating, and equipment are properly arranged</li>
      <li><strong>Timeline Management:</strong> Keep event running on schedule</li>
      <li><strong>Guest Services:</strong> Address any guest needs or concerns promptly</li>
      <li><strong>Problem Resolution:</strong> Handle unexpected issues calmly and efficiently</li>
      <li><strong>Photography Coordination:</strong> Ensure photographer captures all key moments</li>
      <li><strong>Cleanup Management:</strong> Oversee breakdown and venue restoration</li>
    </ul>
  </div>

  <div class="section">
    <h2>📦 Setup Instructions</h2>
    <h3>Decorations & Ambiance:</h3>
    <ul>
      <li>Position decorations according to venue layout</li>
      <li>Ensure proper lighting for photography</li>
      <li>Create focal points (gift table, photo booth, food display)</li>
      <li>Test all electrical decorations and lighting</li>
      <li>Place directional signage for restrooms, parking, etc.</li>
    </ul>
    
    <h3>Food & Beverage Station:</h3>
    <ul>
      <li>Set up serving tables with proper spacing</li>
      <li>Arrange food displays attractively</li>
      <li>Ensure proper temperature control for hot/cold items</li>
      <li>Display menu cards or dietary information</li>
      <li>Stock utensils, plates, napkins, and cups</li>
    </ul>
    
    <h3>Entertainment Area:</h3>
    <ul>
      <li>Clear space for activities/dancing</li>
      <li>Test sound system and microphones</li>
      <li>Set up DJ/entertainment equipment</li>
      <li>Ensure proper electrical connections</li>
      <li>Create backup playlist if needed</li>
    </ul>
  </div>

  <div class="alert">
    <strong>⚠️ Emergency Preparedness</strong>
    <ul style="margin: 10px 0 0 0;">
      <li>First aid kit location: With event coordinator</li>
      <li>Fire extinguisher location: Check with venue staff</li>
      <li>Emergency exits: Clearly marked and accessible</li>
      <li>Backup contact numbers: Keep list readily available</li>
      <li>Weather contingency: Have indoor backup plan if outdoor event</li>
    </ul>
  </div>

  <div class="section">
    <h2>📸 Photography Shot List</h2>
    <h3>Must-Have Shots:</h3>
    <ul>
      <li>Venue/decoration setup photos</li>
      <li>Guest arrivals and mingling</li>
      <li>Food and cake display</li>
      <li>Special moments (speeches, toasts, cake cutting)</li>
      <li>Group photos with guests</li>
      <li>Entertainment/activities</li>
      <li>Candid moments throughout event</li>
      <li>Venue at peak of event</li>
    </ul>
  </div>

  <div class="section">
    <h2>✨ Final Notes</h2>
    <p><strong>Remember:</strong> The goal is to create memorable experiences for all attendees. Stay flexible, positive, and solution-oriented throughout the event.</p>
    <p><strong>Post-Event:</strong> Send thank you notes to vendors and guests within one week of the event.</p>
    <p><strong>Feedback:</strong> Collect feedback to improve future events and share positive experiences on social media.</p>
  </div>

  <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #9333EA; text-align: center; color: #666;">
    <p><strong>CelebrateSmart Event Planning</strong></p>
    <p>Making your celebrations unforgettable | www.celebratesmart.com</p>
    <p style="font-size: 12px; margin-top: 10px;">This event plan was professionally generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `.trim();
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
      <div className='max-w-6xl mx-auto space-y-8'>
        {!showEventPlan ? (
          <>
            {/* Confirmation Success */}
            <div className='text-center space-y-4'>
              
              <h1 className='text-4xl font-bold'>Order Confirmed!</h1>
              <p className='text-xl text-muted-foreground'>
                Your celebration items have been successfully ordered
              </p>
            </div>

            <div className='bg-card border border-border rounded-lg p-8 space-y-6'>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <p className='text-sm text-muted-foreground mb-1'>Order ID</p>
                <p className='text-2xl font-bold'>{orderId}</p>
              </div>

              {event && (
                <div className='pb-6 border-b border-border'>
                  <h2 className='font-bold text-lg mb-4'>Event Details</h2>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Event Name</span>
                      <span className='font-semibold'>{event.name}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Event Type</span>
                      <span className='font-semibold capitalize'>{event.type}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Date & Time</span>
                      <span className='font-semibold'>{event.date} at {event.time}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Venue</span>
                      <span className='font-semibold'>{event.venue}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className='pb-6 border-b border-border'>
                <h2 className='font-bold text-lg mb-4'>Order Items</h2>
                <div className='space-y-3'>
                  {cart.map(item => (
                    <div key={item.id} className='flex justify-between items-center'>
                      <div className='flex items-center gap-3'>
                        <span className='text-2xl'>{item.image}</span>
                        <div>
                          <p className='font-semibold'>{item.name}</p>
                          <p className='text-xs text-muted-foreground'>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className='font-semibold'>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-2 pb-6 border-b border-border'>
                <div className='flex justify-between text-sm'>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='font-bold text-lg'>Total</span>
                <span className='text-3xl font-bold text-primary'>${total.toFixed(2)}</span>
              </div>

              <div className='bg-primary/10 border border-primary/30 rounded-lg p-4'>
                <p className='text-sm text-foreground'>
                  <strong>📧 Confirmation email</strong> has been sent to your registered email address. Check your inbox for order details and tracking information.
                </p>
              </div>
            </div>

            {/* Event Plan CTA */}
            {event && (
              <div className='bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 text-center space-y-4'>
                <h2 className='text-3xl font-bold'>🎉 Your Professional Event Plan is Ready!</h2>
                <p className='text-lg'>
                  We've created a comprehensive event plan with timeline, checklist, setup instructions, and more.
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center pt-4'>
                  <button
                    onClick={() => setShowEventPlan(true)}
                    className='inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary rounded-lg font-bold hover:scale-105 transition-all shadow-lg text-lg'
                  >
                    <CheckCircle className='w-6 h-6' />
                    View Event Plan
                  </button>
                  <button
                    onClick={handleDownloadPlan}
                    className='inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur text-white rounded-lg font-bold hover:bg-white/30 transition-all border-2 border-white text-lg'
                  >
                    <Download className='w-6 h-6' />
                    Download Plan
                  </button>
                </div>
              </div>
            )}

            <div className='space-y-3'>
              <div className='bg-accent/10 border border-accent/30 rounded-lg p-4'>
                <h3 className='font-bold mb-2'>What's Next?</h3>
                <ul className='space-y-2 text-sm'>
                  <li className='flex items-start gap-2'>
                    <span>📋</span>
                    <span>Review your professional event plan above</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span>📦</span>
                    <span>You'll receive delivery updates for each item</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span>🔔</span>
                    <span>We'll send reminders leading up to your event</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span>📞</span>
                    <span>Contact us if you need any assistance</span>
                  </li>
                </ul>
              </div>

              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => onNavigate('event-templates')}
                  className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
                >
                  Plan Another Event
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Event Plan View */}
            <div className='space-y-6'>
              <div className='flex items-center justify-between bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6'>
                <div>
                  <h1 className='text-3xl font-bold'>{event?.name} - Event Plan</h1>
                  <p className='text-white/90 mt-1'>Professional Event Planning Document</p>
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
                    className='inline-flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-semibold hover:scale-105 transition-all shadow-lg no-print'
                  >
                    <Download className='w-5 h-5' />
                    Download
                  </button>
                  <button
                    onClick={() => setShowEventPlan(false)}
                    className='inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg font-semibold hover:bg-white/30 transition-all border-2 border-white no-print'
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Event Plan Content */}
              <div className='bg-white rounded-lg shadow-lg p-8 space-y-8'>
                {/* Event Overview */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4 flex items-center gap-2'>
                    📋 Event Overview
                  </h2>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='bg-primary/10 p-4 rounded-lg'>
                      <div className='flex items-center gap-2 text-primary mb-2'>
                        <Calendar className='w-5 h-5' />
                        <span className='font-bold'>Date</span>
                      </div>
                      <p className='text-lg'>{event?.date}</p>
                    </div>
                    <div className='bg-secondary/10 p-4 rounded-lg'>
                      <div className='flex items-center gap-2 text-secondary mb-2'>
                        <Clock className='w-5 h-5' />
                        <span className='font-bold'>Time</span>
                      </div>
                      <p className='text-lg'>{event?.time}</p>
                    </div>
                    <div className='bg-accent/10 p-4 rounded-lg'>
                      <div className='flex items-center gap-2 text-accent mb-2'>
                        <MapPin className='w-5 h-5' />
                        <span className='font-bold'>Venue</span>
                      </div>
                      <p className='text-lg'>{event?.venue}</p>
                    </div>
                  </div>
                  {event?.notes && (
                    <div className='mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded'>
                      <p className='font-bold text-yellow-800'>Special Notes:</p>
                      <p className='text-yellow-900'>{event.notes}</p>
                    </div>
                  )}
                </section>

                {/* Event Day Timeline */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4'>⏰ Event Day Timeline</h2>
                  <div className='space-y-4'>
                    <TimelineItem 
                      time={`2 Hours Before`}
                      title="Setup & Preparation"
                      tasks={[
                        'Arrive at venue and confirm access',
                        'Set up decorations and signage',
                        'Arrange tables, chairs, and centerpieces',
                        'Test audio/visual equipment',
                        'Coordinate with vendors for deliveries'
                      ]}
                    />
                    <TimelineItem 
                      time="1 Hour Before"
                      title="Final Preparations"
                      tasks={[
                        'Display food and beverages',
                        'Set up gift/registration table',
                        'Conduct final walkthrough',
                        'Brief staff/volunteers on their roles',
                        'Test lighting and music'
                      ]}
                    />
                    <TimelineItem 
                      time={event?.time || ''}
                      title="Event Start - Guest Arrival"
                      tasks={[
                        'Welcome guests at entrance',
                        'Direct guests to registration/gift area',
                        'Serve welcome drinks/appetizers',
                        'Background music playing'
                      ]}
                      highlight
                    />
                    <TimelineItem 
                      time="Mid-Event"
                      title="Main Activities & Food Service"
                      tasks={[
                        'Serve main food/cake',
                        'Scheduled performances or activities',
                        'Games or interactive segments',
                        'Special moments (toasts, speeches, cake cutting)',
                        'Photo opportunities'
                      ]}
                    />
                    <TimelineItem 
                      time="Final Hour"
                      title="Wrap-Up & Farewell"
                      tasks={[
                        'Last call for photos',
                        'Thank you speech/closing remarks',
                        'Distribute party favors',
                        'Guest departure'
                      ]}
                    />
                  </div>
                </section>

                {/* Budget Breakdown */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4 flex items-center gap-2'>
                    <DollarSign className='w-6 h-6' />
                    Budget Breakdown
                  </h2>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-primary text-primary-foreground'>
                        <tr>
                          <th className='text-left p-3'>Item/Service</th>
                          <th className='text-left p-3'>Category</th>
                          <th className='text-center p-3'>Qty</th>
                          <th className='text-right p-3'>Price</th>
                          <th className='text-right p-3'>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className='p-3'>
                              <span className='mr-2'>{item.image}</span>
                              {item.name}
                            </td>
                            <td className='p-3'>{item.category}</td>
                            <td className='text-center p-3'>{item.quantity}</td>
                            <td className='text-right p-3'>${item.price.toFixed(2)}</td>
                            <td className='text-right p-3 font-semibold'>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className='bg-primary/10 font-bold'>
                        <tr>
                          <td colSpan={4} className='text-right p-3'>Subtotal:</td>
                          <td className='text-right p-3'>${subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={4} className='text-right p-3'>Tax (10%):</td>
                          <td className='text-right p-3'>${tax.toFixed(2)}</td>
                        </tr>
                        <tr className='text-lg'>
                          <td colSpan={4} className='text-right p-3'>TOTAL PAID:</td>
                          <td className='text-right p-3 text-primary'>${total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                {/* Checklist */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4'>✅ Complete Planning Checklist</h2>
                  <div className='space-y-4'>
                    <ChecklistSection 
                      title="Completed Tasks"
                      items={event?.completedTasks.map(task => task.charAt(0).toUpperCase() + task.slice(1) + ' arrangements') || []}
                      completed
                    />
                    <ChecklistSection 
                      title="Final Week Tasks"
                      items={[
                        'Confirm final guest count',
                        'Final vendor confirmations',
                        'Prepare welcome/thank you speeches',
                        'Pack all event materials',
                        'Charge all devices and equipment'
                      ]}
                    />
                  </div>
                </section>

                {/* Important Contacts */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4'>📞 Important Contacts</h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 bg-blue-50 rounded-lg'>
                      <p className='font-bold text-blue-900'>Venue</p>
                      <p className='text-blue-800'>{event?.venue}</p>
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
                    <div className='p-4 bg-primary/10 rounded-lg'>
                      <p className='font-bold text-primary'>Order Reference</p>
                      <p className='text-foreground'>{orderId}</p>
                      <p className='text-sm text-muted-foreground mt-1'>Quote for inquiries</p>
                    </div>
                  </div>
                </section>

                {/* Setup Instructions */}
                <section className='border-b pb-6'>
                  <h2 className='text-2xl font-bold text-primary mb-4'>📦 Setup Instructions</h2>
                  <div className='space-y-4'>
                    <div className='p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded'>
                      <p className='font-bold text-yellow-900 mb-2'>Decorations & Ambiance</p>
                      <ul className='list-disc list-inside text-yellow-800 space-y-1'>
                        <li>Position decorations according to venue layout</li>
                        <li>Ensure proper lighting for photography</li>
                        <li>Test all electrical decorations</li>
                        <li>Place directional signage</li>
                      </ul>
                    </div>
                    <div className='p-4 bg-green-50 border-l-4 border-green-400 rounded'>
                      <p className='font-bold text-green-900 mb-2'>Food & Beverage Station</p>
                      <ul className='list-disc list-inside text-green-800 space-y-1'>
                        <li>Set up serving tables with proper spacing</li>
                        <li>Arrange food displays attractively</li>
                        <li>Ensure temperature control for hot/cold items</li>
                        <li>Stock utensils, plates, napkins</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Emergency Info */}
                <section>
                  <div className='p-6 bg-accent/10 border-2 border-accent/30 rounded-lg'>
                    <h3 className='font-bold text-accent text-xl mb-3 flex items-center gap-2'>
                      <AlertCircle className='w-6 h-6' />
                      Emergency Preparedness
                    </h3>
                    <ul className='space-y-2 text-foreground/90'>
                      <li className='flex items-start gap-2'>
                        <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                        <span>First aid kit with event coordinator</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                        <span>Emergency exits clearly marked</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                        <span>Backup contact numbers readily available</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <CheckCircle className='w-5 h-5 mt-1 flex-shrink-0' />
                        <span>Weather contingency plan prepared</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Footer */}
                <div className='mt-8 pt-6 border-t-2 border-primary/20 text-center text-gray-600'>
                  <p className='font-bold text-primary text-lg'>CelebrateSmart Event Planning</p>
                  <p className='text-sm mt-1'>Making your celebrations unforgettable</p>
                  <p className='text-xs mt-2'>Generated on {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className='flex flex-col sm:flex-row gap-4 no-print'>
                <button
                  onClick={() => setShowEventPlan(false)}
                  className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
                >
                  Back to Confirmation
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components
function TimelineItem({ time, title, tasks, highlight = false }: { time: string; title: string; tasks: string[]; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border-l-4 ${highlight ? 'bg-secondary/10 border-secondary' : 'bg-primary/10 border-primary'}`}>
      <div className='flex items-center gap-3 mb-2'>
        <Clock className={`w-5 h-5 ${highlight ? 'text-secondary' : 'text-primary'}`} />
        <span className={`font-bold text-lg ${highlight ? 'text-secondary' : 'text-primary'}`}>{time}</span>
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

function ChecklistSection({ title, items, completed = false }: { title: string; items: string[]; completed?: boolean }) {
  return (
    <div className={`p-4 rounded-lg ${completed ? 'bg-green-50' : 'bg-gray-50'}`}>
      <h3 className={`font-bold mb-3 ${completed ? 'text-green-900' : 'text-gray-800'}`}>{title}</h3>
      <ul className='space-y-2'>
        {items.map((item, idx) => (
          <li key={idx} className='flex items-start gap-3'>
            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${completed ? 'text-green-600' : 'text-gray-400'}`} />
            <span className={completed ? 'text-green-800' : 'text-gray-700'}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
