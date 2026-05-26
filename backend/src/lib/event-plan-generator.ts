export interface PlanStep {
  weeksBefore: number;
  timeOfDay:   string | null;
  title:       string;
  description: string;
  category:    string;
  sortOrder:   number;
}

type PlanStepInput = Omit<PlanStep, 'sortOrder'>;

// Offset minutes from event start time, clamped to 00:00–23:59
function offsetTime(eventTime: string, offsetMinutes: number): string {
  const [h, m] = eventTime.split(':').map(Number);
  const total = Math.max(0, Math.min(23 * 60 + 59, h * 60 + m + offsetMinutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DIY event plan — all customer-facing tasks (used when no package is booked)
// ─────────────────────────────────────────────────────────────────────────────
export function generateEventPlan(
  eventType:  string,
  guestCount: number,
  categories: string[],
): PlanStep[] {
  const steps: PlanStepInput[] = [];
  const has = (c: string) => categories.includes(c);

  // Universal customer tasks
  steps.push({ weeksBefore: 10, timeOfDay: null, category: 'GENERAL',
    title: 'Send invitations',
    description: `Send invitations to your ${guestCount} guests. Use digital invitations for quick RSVPs and tracking.` });

  steps.push({ weeksBefore: 8, timeOfDay: null, category: 'GENERAL',
    title: 'Chase RSVPs',
    description: 'Follow up with guests who haven\'t responded. Finalise your headcount for catering and seating.' });

  steps.push({ weeksBefore: 6, timeOfDay: null, category: 'GENERAL',
    title: 'Confirm guest list & dietary needs',
    description: 'Lock in your final guest count and collect all dietary requirements (vegetarian, vegan, allergies).' });

  steps.push({ weeksBefore: 4, timeOfDay: null, category: 'GENERAL',
    title: 'Follow up with all vendors',
    description: 'Check in with every vendor to confirm bookings are on track and share the event schedule.' });

  steps.push({ weeksBefore: 2, timeOfDay: null, category: 'GENERAL',
    title: 'Create the event day run sheet',
    description: 'Write a detailed minute-by-minute schedule. Share it with all vendors and your event coordinator.' });

  steps.push({ weeksBefore: 1, timeOfDay: null, category: 'GENERAL',
    title: 'Final vendor confirmations',
    description: 'Call every vendor to confirm arrival times, final headcount, and any last-minute details.' });

  steps.push({ weeksBefore: 0, timeOfDay: '23:00', category: 'GENERAL',
    title: 'Wrap up & thank guests',
    description: 'Thank your guests personally. Arrange transport if needed and collect any personal belongings.' });

  if (has('VENUE')) {
    steps.push({ weeksBefore: 12, timeOfDay: null, category: 'VENUE',
      title: 'Sign venue contract & pay deposit',
      description: 'Review the venue hire agreement carefully. Confirm deposit payment and cancellation policy.' });
    steps.push({ weeksBefore: 8, timeOfDay: null, category: 'VENUE',
      title: 'Plan venue layout',
      description: 'Walk through the space with the venue coordinator. Decide on table layout, stage, and décor placement.' });
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'VENUE',
      title: 'Provide final headcount to venue',
      description: `Confirm your final guest count of approximately ${guestCount} to the venue for seating and catering prep.` });
    steps.push({ weeksBefore: 0, timeOfDay: '13:00', category: 'VENUE',
      title: 'Venue opens — setup begins',
      description: 'Venue team opens the space. Coordinate delivery and setup of all decorations and equipment.' });
  }

  if (has('FOOD')) {
    steps.push({ weeksBefore: 8, timeOfDay: null, category: 'FOOD',
      title: 'Finalise menu selection',
      description: 'Confirm your menu choices with the caterer. Factor in all dietary requirements from your guest list.' });
    steps.push({ weeksBefore: 3, timeOfDay: null, category: 'FOOD',
      title: 'Send dietary requirements to caterer',
      description: 'Provide a full list of dietary needs so the kitchen can prepare.' });
    steps.push({ weeksBefore: 1, timeOfDay: null, category: 'FOOD',
      title: 'Confirm final headcount with caterer',
      description: `Give the catering team your confirmed headcount (approx. ${guestCount}) for final food preparation.` });
    steps.push({ weeksBefore: 0, timeOfDay: '15:30', category: 'FOOD',
      title: 'Catering team arrives & sets up',
      description: 'Caterers arrive to set up kitchen stations, service tables, and prepare for food service.' });
    steps.push({ weeksBefore: 0, timeOfDay: '17:30', category: 'FOOD',
      title: 'Food service begins',
      description: 'Guests are invited to the food and drink area. Ensure staff are briefed on service flow.' });
  }

  if (has('CAKES')) {
    steps.push({ weeksBefore: 8, timeOfDay: null, category: 'CAKES',
      title: 'Confirm cake design & flavour',
      description: 'Finalise the cake design, tier count, flavours, and personalised message with your baker.' });
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'CAKES',
      title: 'Confirm cake delivery time',
      description: 'Verify the exact delivery time and location with the bakery. Confirm storage at the venue.' });
    steps.push({ weeksBefore: 0, timeOfDay: '15:00', category: 'CAKES',
      title: 'Cake delivered & inspected',
      description: 'Receive and inspect the cake on delivery. Coordinate with caterers for safe storage until cake cutting.' });
    const cakeCuttingTime = eventType === 'WEDDING' ? '20:00' : '19:00';
    steps.push({ weeksBefore: 0, timeOfDay: cakeCuttingTime, category: 'CAKES',
      title: 'Cake cutting ceremony',
      description: 'Gather guests for the cake cutting moment. Brief the photographer to be ready for this highlight.' });
  }

  if (has('PHOTOGRAPHY')) {
    steps.push({ weeksBefore: 6, timeOfDay: null, category: 'PHOTOGRAPHY',
      title: 'Share event timeline with photographer',
      description: 'Send your photographer the full event schedule and a list of key moments you want captured.' });
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'PHOTOGRAPHY',
      title: 'Create your shot list',
      description: 'Prepare a detailed shot list: group photos, portraits, décor shots, and must-have candid moments.' });
    steps.push({ weeksBefore: 0, timeOfDay: '15:00', category: 'PHOTOGRAPHY',
      title: 'Photographer arrives',
      description: 'Photographer arrives for a venue walk-through and to capture early setup and arriving guests.' });
    steps.push({ weeksBefore: 0, timeOfDay: '16:00', category: 'PHOTOGRAPHY',
      title: 'Group & formal photos',
      description: 'Schedule a dedicated 30–45 minutes for formal group photos before the main event begins.' });
  }

  if (has('ENTERTAINMENT')) {
    steps.push({ weeksBefore: 6, timeOfDay: null, category: 'ENTERTAINMENT',
      title: 'Share music preferences with DJ / band',
      description: 'Send your must-play and do-not-play lists, plus any requests for special songs.' });
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'ENTERTAINMENT',
      title: 'Confirm entertainment schedule & set times',
      description: 'Agree on set times, breaks, and any special announcements.' });
    steps.push({ weeksBefore: 0, timeOfDay: '16:00', category: 'ENTERTAINMENT',
      title: 'DJ / Band arrives for soundcheck',
      description: 'Entertainment team arrives for full setup and soundcheck. Test microphone levels for speeches.' });
    steps.push({ weeksBefore: 0, timeOfDay: '18:00', category: 'ENTERTAINMENT',
      title: 'Entertainment begins',
      description: 'Music starts as guests arrive — set an upbeat, welcoming mood from the moment doors open.' });
  }

  if (has('DECORATIONS')) {
    steps.push({ weeksBefore: 6, timeOfDay: null, category: 'DECORATIONS',
      title: 'Confirm decoration theme & colour palette',
      description: 'Lock in your colour scheme, balloon design, centrepiece style, and any custom banners or signage.' });
    steps.push({ weeksBefore: 1, timeOfDay: null, category: 'DECORATIONS',
      title: 'Confirm decoration delivery & setup time',
      description: 'Coordinate with your supplier on delivery window and setup duration so it fits the event schedule.' });
    steps.push({ weeksBefore: 0, timeOfDay: '13:30', category: 'DECORATIONS',
      title: 'Decoration setup begins',
      description: 'Decoration team arrives to install balloons, centrepieces, lighting, banners, and themed props.' });
  }

  if (has('GIFTS')) {
    steps.push({ weeksBefore: 4, timeOfDay: null, category: 'GIFTS',
      title: 'Organise gift & favour station',
      description: 'Set up a dedicated gift table and arrange party favours at each place setting or near the exit.' });
  }

  if (eventType === 'WEDDING') {
    steps.push({ weeksBefore: 16, timeOfDay: null, category: 'GENERAL',
      title: 'Book officiant / celebrant',
      description: 'Confirm your ceremony officiant and brief them on the ceremony style, vows, and running order.' });
    steps.push({ weeksBefore: 4, timeOfDay: null, category: 'GENERAL',
      title: 'Confirm ceremony running order',
      description: 'Finalise the ceremony script, readings, music choices, and seating plan for the ceremony.' });
    steps.push({ weeksBefore: 0, timeOfDay: '17:00', category: 'GENERAL',
      title: 'Ceremony begins',
      description: 'Guests take their seats. Ceremony begins on schedule. Ensure ushers are briefed in advance.' });
    steps.push({ weeksBefore: 0, timeOfDay: '17:45', category: 'GENERAL',
      title: 'Cocktail hour',
      description: 'Guests enjoy drinks and canapés while the couple takes formal photographs.' });
    steps.push({ weeksBefore: 0, timeOfDay: '19:00', category: 'GENERAL',
      title: 'Wedding reception dinner',
      description: 'Guests are seated for the reception dinner. Speeches and toasts take place during the meal.' });
  }

  if (eventType === 'PROPOSAL') {
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'GENERAL',
      title: 'Confirm the surprise plan',
      description: 'Brief any helpers on their roles. Confirm the exact timing of the proposal moment.' });
    steps.push({ weeksBefore: 0, timeOfDay: '19:00', category: 'GENERAL',
      title: 'The proposal moment',
      description: 'The photographer is in position. The moment arrives — enjoy it!' });
  }

  if (eventType === 'BIRTHDAY') {
    steps.push({ weeksBefore: 0, timeOfDay: '18:00', category: 'GENERAL',
      title: 'Guests arrive',
      description: 'Welcome guests as they arrive. Have drinks and canapés ready from the start.' });
    steps.push({ weeksBefore: 0, timeOfDay: '20:00', category: 'GENERAL',
      title: 'Birthday song & candle blow-out',
      description: 'Gather all guests for the birthday song. Have the photographer ready to capture the moment.' });
  }

  if (eventType === 'KIDS_PARTY') {
    steps.push({ weeksBefore: 0, timeOfDay: '14:00', category: 'GENERAL',
      title: 'Party games & activities begin',
      description: 'Entertainer leads games and activities. Keep energy high with structured fun every 20 minutes.' });
    steps.push({ weeksBefore: 0, timeOfDay: '15:30', category: 'GENERAL',
      title: 'Party food served',
      description: 'Seat the children for party food. Have party favours ready to hand out at the end.' });
  }

  if (eventType === 'BABY_SHOWER') {
    steps.push({ weeksBefore: 0, timeOfDay: '14:30', category: 'GENERAL',
      title: 'Baby shower games',
      description: 'Lead the group through fun baby shower games. Keep them light-hearted and inclusive.' });
    steps.push({ weeksBefore: 0, timeOfDay: '15:30', category: 'GENERAL',
      title: 'Gift opening',
      description: 'The mum-to-be opens gifts while someone notes who gave what for thank-you cards.' });
  }

  return steps
    .sort((a, b) => {
      if (b.weeksBefore !== a.weeksBefore) return b.weeksBefore - a.weeksBefore;
      if (a.timeOfDay && b.timeOfDay) return a.timeOfDay.localeCompare(b.timeOfDay);
      return 0;
    })
    .map((step, i) => ({ ...step, sortOrder: i }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Package event plan — split between customer to-dos (GENERAL) and
// vendor/CelebrateSmart actions (all other categories).
// ─────────────────────────────────────────────────────────────────────────────
export function generatePackagePlan(
  eventType:  string,
  guestCount: number,
  categories: string[],
  eventTime:  string = '18:00',
): PlanStep[] {
  const steps: PlanStepInput[] = [];
  const has = (c: string) => categories.includes(c);
  const hasSetup = has('DECORATIONS');

  // ── Customer to-dos (GENERAL) ───────────────────────────────────────────
  steps.push({ weeksBefore: 10, timeOfDay: null, category: 'GENERAL',
    title: 'Send invitations',
    description: `Send invitations to your ${guestCount} guests. Include the date, time, venue, and any dress code details.` });

  steps.push({ weeksBefore: 8, timeOfDay: null, category: 'GENERAL',
    title: 'Chase RSVPs',
    description: 'Follow up with guests who haven\'t responded. Your confirmed headcount helps our team prepare everything perfectly.' });

  steps.push({ weeksBefore: 2, timeOfDay: null, category: 'GENERAL',
    title: 'Confirm final headcount with us',
    description: `Call or message your coordinator with your final confirmed guest count and any last-minute dietary requirements before we finalise all orders.` });

  if (hasSetup) {
    steps.push({ weeksBefore: 1, timeOfDay: null, category: 'GENERAL',
      title: 'Confirm venue access for our setup team',
      description: `Our setup team arrives at ${offsetTime(eventTime, -10 * 60)}. Let your venue coordinator know to expect them and arrange key access if needed.` });
  }

  steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -30), category: 'GENERAL',
    title: 'Arrive at venue',
    description: 'Arrive 30 minutes before guests so you can do a final walk-through with our coordinator before the doors open.' });

  steps.push({ weeksBefore: 0, timeOfDay: '23:00', category: 'GENERAL',
    title: 'Wrap up & thank your guests',
    description: 'Thank your guests personally. Our team will handle the cleanup — you just enjoy the evening to the very end.' });

  // ── CelebrateSmart management (MANAGEMENT) ──────────────────────────────
  steps.push({ weeksBefore: 3, timeOfDay: null, category: 'MANAGEMENT',
    title: 'We finalise your complete order',
    description: 'Our operations team locks in all items, confirms quantities with every vendor, and ensures everything is on schedule for your event.' });

  steps.push({ weeksBefore: 1, timeOfDay: null, category: 'MANAGEMENT',
    title: 'Coordinator calls you to confirm',
    description: 'Your dedicated event coordinator will call to confirm all final details — timing, venue access, final headcount, and any special requests.' });

  steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -45), category: 'MANAGEMENT',
    title: 'Final pre-event check',
    description: 'Our coordinator does a final walkthrough of the venue to confirm everything is in place and on schedule before guests arrive.' });

  // ── Decorations / Setup (DECORATIONS) ───────────────────────────────────
  if (has('DECORATIONS')) {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -10 * 60), category: 'DECORATIONS',
      title: 'Setup team arrives at venue',
      description: `Our decorations team arrives 10 hours before your event to begin installing centrepieces, balloons, lighting, backdrops, and all themed décor.` });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -60), category: 'DECORATIONS',
      title: 'Venue setup complete',
      description: 'Every decoration is in place. Our team does a final quality check — your venue is transformed and ready for guests.' });
  }

  // ── Cake (CAKES) ────────────────────────────────────────────────────────
  if (has('CAKES')) {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -3 * 60), category: 'CAKES',
      title: 'Cake delivered to venue',
      description: 'Our baker delivers and inspects your cake on arrival. It is safely stored at the venue until the cake cutting moment.' });

    const cakeCutOffset = eventType === 'WEDDING' ? 120 : 60;
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, cakeCutOffset), category: 'CAKES',
      title: 'Cake cutting ceremony',
      description: 'Our team presents the cake and ensures the photographer is ready. The cake cutting moment is perfectly timed and captured.' });
  }

  // ── Food & Catering (FOOD) ───────────────────────────────────────────────
  if (has('FOOD')) {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -2 * 60 - 30), category: 'FOOD',
      title: 'Catering team arrives & sets up',
      description: 'Our catering team arrives to set up all kitchen stations, service tables, and begins food preparation for your guests.' });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 15), category: 'FOOD',
      title: 'Food service begins',
      description: 'Guests are welcomed to the food and drink area. Our service staff are briefed and ready for a smooth, elegant service.' });
  }

  // ── Photography (PHOTOGRAPHY) ───────────────────────────────────────────
  if (has('PHOTOGRAPHY')) {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -2 * 60), category: 'PHOTOGRAPHY',
      title: 'Photographer arrives & sets up',
      description: 'Your photographer arrives early to do a venue walk-through, capture setup shots, and be ready for the first arriving guests.' });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -30), category: 'PHOTOGRAPHY',
      title: 'Group & formal photos',
      description: 'Dedicated session for formal group photos before the event gets into full swing.' });
  }

  // ── Entertainment (ENTERTAINMENT) ───────────────────────────────────────
  if (has('ENTERTAINMENT')) {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, -2 * 60), category: 'ENTERTAINMENT',
      title: 'Entertainment setup & soundcheck',
      description: 'Your DJ / band arrives for full setup and soundcheck. All microphone and speaker levels are tested before guests arrive.' });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 0), category: 'ENTERTAINMENT',
      title: 'Entertainment begins',
      description: 'Music starts as the first guests arrive, creating the perfect welcoming atmosphere from the very first moment.' });
  }

  // ── Event-type specific moments ─────────────────────────────────────────
  if (eventType === 'WEDDING') {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 0), category: 'GENERAL',
      title: 'Ceremony begins',
      description: 'Guests are seated and everything is in position. Your perfect ceremony is about to begin.' });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 60), category: 'GENERAL',
      title: 'Cocktail hour & photos',
      description: 'Guests enjoy drinks and canapés while the couple takes formal photographs with the photographer.' });
  }

  if (eventType === 'BIRTHDAY' || eventType === 'KIDS_PARTY') {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 60), category: 'GENERAL',
      title: 'Birthday song & cake cutting',
      description: 'Gather all guests for the birthday song. Our photographer is positioned and ready to capture every moment.' });
  }

  if (eventType === 'PROPOSAL') {
    steps.push({ weeksBefore: 2, timeOfDay: null, category: 'GENERAL',
      title: 'Finalise the surprise details with us',
      description: 'Confirm the exact timing and any special requests with your coordinator so our team can set the perfect scene.' });
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 0), category: 'GENERAL',
      title: 'The proposal moment 💍',
      description: 'Our photographer is in position, the scene is set. The most important moment is about to happen — enjoy it!' });
  }

  if (eventType === 'BABY_SHOWER') {
    steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 90), category: 'GENERAL',
      title: 'Gift opening',
      description: 'The mum-to-be opens gifts while a helper notes who gave what for thank-you cards later.' });
  }

  // ── The big moment (always last GENERAL step of the day) ────────────────
  steps.push({ weeksBefore: 0, timeOfDay: offsetTime(eventTime, 0), category: 'GENERAL',
    title: `🎉 Your ${eventType === 'WEDDING' ? 'wedding' : eventType === 'PROPOSAL' ? 'proposal' : 'celebration'} begins!`,
    description: `Everything is set and your CelebrateSmart team is in position. ${guestCount} guests are ready to celebrate — it's time to enjoy every moment!` });

  return steps
    .sort((a, b) => {
      if (b.weeksBefore !== a.weeksBefore) return b.weeksBefore - a.weeksBefore;
      if (a.timeOfDay && b.timeOfDay) return a.timeOfDay.localeCompare(b.timeOfDay);
      if (a.timeOfDay) return 1;
      if (b.timeOfDay) return -1;
      return 0;
    })
    .map((step, i) => ({ ...step, sortOrder: i }));
}
