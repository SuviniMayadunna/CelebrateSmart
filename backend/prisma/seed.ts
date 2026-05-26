/// <reference types="node" />
import { PrismaClient, TaskCategory, ProductCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@celebratesmart.com' },
    update: {},
    create: {
      name:     'Admin User',
      email:    'admin@celebratesmart.com',
      password: adminPassword,
      phone:    '+1-555-0100',
      role:     'ADMIN',
    },
  });

  // ── Event Templates ─────────────────────────────────────────────────────────
  const templates = [
    {
      slug:        'birthday',
      name:        'Birthday Party',
      emoji:       '🎂',
      description: 'Plan an unforgettable birthday celebration with all the essentials.',
      steps: [
        { title: 'Book a Venue',            category: TaskCategory.VENUE,         sortOrder: 1 },
        { title: 'Order the Cake',          category: TaskCategory.CAKE,          sortOrder: 2 },
        { title: 'Plan Decorations',        category: TaskCategory.DECORATIONS,   sortOrder: 3 },
        { title: 'Arrange Food & Drinks',   category: TaskCategory.FOOD,          sortOrder: 4 },
        { title: 'Book Entertainment',      category: TaskCategory.ENTERTAINMENT, sortOrder: 5 },
        { title: 'Hire Photographer',       category: TaskCategory.PHOTOGRAPHY,   sortOrder: 6 },
      ],
    },
    {
      slug:        'proposal',
      name:        'Romantic Proposal',
      emoji:       '💍',
      description: 'Create the perfect moment with a meticulously planned romantic proposal.',
      steps: [
        { title: 'Choose the Venue',        category: TaskCategory.VENUE,               sortOrder: 1 },
        { title: 'Arrange Flowers',         category: TaskCategory.FLOWERS,             sortOrder: 2 },
        { title: 'Plan Decorations',        category: TaskCategory.DECORATIONS,         sortOrder: 3 },
        { title: 'Book Photographer',       category: TaskCategory.PHOTOGRAPHY,         sortOrder: 4 },
        { title: 'Celebration Dinner',      category: TaskCategory.CELEBRATION_DINNER,  sortOrder: 5 },
        { title: 'Arrange Entertainment',   category: TaskCategory.ENTERTAINMENT,       sortOrder: 6 },
      ],
    },
    {
      slug:        'baby-shower',
      name:        'Baby Shower',
      emoji:       '🍼',
      description: 'Celebrate the upcoming arrival with a warm and joyful baby shower.',
      steps: [
        { title: 'Plan Decorations',        category: TaskCategory.DECORATIONS,         sortOrder: 1 },
        { title: 'Order the Cake',          category: TaskCategory.CAKE,                sortOrder: 2 },
        { title: 'Arrange Food & Drinks',   category: TaskCategory.FOOD,                sortOrder: 3 },
        { title: 'Organise Gift Station',   category: TaskCategory.GIFTS,               sortOrder: 4 },
        { title: 'Plan Games & Activities', category: TaskCategory.GAMES_AND_ACTIVITIES, sortOrder: 5 },
        { title: 'Hire Photographer',       category: TaskCategory.PHOTOGRAPHY,         sortOrder: 6 },
      ],
    },
    {
      slug:        'bride-to-be',
      name:        'Bride-to-Be Party',
      emoji:       '👰',
      description: 'Give the bride-to-be a night to remember with glamour and fun.',
      steps: [
        { title: 'Book a Venue',            category: TaskCategory.VENUE,               sortOrder: 1 },
        { title: 'Plan Decorations',        category: TaskCategory.DECORATIONS,         sortOrder: 2 },
        { title: 'Arrange Food & Drinks',   category: TaskCategory.FOOD,                sortOrder: 3 },
        { title: 'Book Entertainment',      category: TaskCategory.ENTERTAINMENT,       sortOrder: 4 },
        { title: 'Plan Games & Activities', category: TaskCategory.GAMES_AND_ACTIVITIES, sortOrder: 5 },
        { title: 'Hire Photographer',       category: TaskCategory.PHOTOGRAPHY,         sortOrder: 6 },
      ],
    },
    {
      slug:        'wedding-reception',
      name:        'Wedding Reception',
      emoji:       '💒',
      description: 'A complete planning guide for your dream wedding reception — venue to cake.',
      steps: [
        { title: 'Book the Venue',               category: TaskCategory.VENUE,         sortOrder: 1 },
        { title: 'Plan the Wedding Menu',        category: TaskCategory.FOOD,          sortOrder: 2 },
        { title: 'Order the Wedding Cake',       category: TaskCategory.CAKE,          sortOrder: 3 },
        { title: 'Book Wedding Photographer',    category: TaskCategory.PHOTOGRAPHY,   sortOrder: 4 },
        { title: 'Arrange Floral Décor',         category: TaskCategory.FLOWERS,       sortOrder: 5 },
        { title: 'Set Up Venue Decorations',     category: TaskCategory.DECORATIONS,   sortOrder: 6 },
        { title: 'Book Live Music or DJ',        category: TaskCategory.ENTERTAINMENT, sortOrder: 7 },
      ],
    },
    {
      slug:        'corporate-event',
      name:        'Corporate Event',
      emoji:       '🏢',
      description: 'A streamlined plan for professional corporate events, product launches, and team celebrations.',
      steps: [
        { title: 'Book the Venue',               category: TaskCategory.VENUE,         sortOrder: 1 },
        { title: 'Arrange Catering',             category: TaskCategory.FOOD,          sortOrder: 2 },
        { title: 'Set Up Event Décor',           category: TaskCategory.DECORATIONS,   sortOrder: 3 },
        { title: 'Book Event Photographer',      category: TaskCategory.PHOTOGRAPHY,   sortOrder: 4 },
        { title: 'Arrange AV & Entertainment',   category: TaskCategory.ENTERTAINMENT, sortOrder: 5 },
      ],
    },
    {
      slug:        'anniversary-celebration',
      name:        'Anniversary Celebration',
      emoji:       '💖',
      description: 'Celebrate your special milestone with a romantic and unforgettable anniversary event.',
      steps: [
        { title: 'Book a Special Venue',         category: TaskCategory.VENUE,              sortOrder: 1 },
        { title: 'Order Anniversary Cake',       category: TaskCategory.CAKE,               sortOrder: 2 },
        { title: 'Arrange Romantic Décor',       category: TaskCategory.DECORATIONS,        sortOrder: 3 },
        { title: 'Organise Floral Arrangements', category: TaskCategory.FLOWERS,            sortOrder: 4 },
        { title: 'Book Photographer',            category: TaskCategory.PHOTOGRAPHY,        sortOrder: 5 },
        { title: 'Plan Celebration Dinner',      category: TaskCategory.CELEBRATION_DINNER, sortOrder: 6 },
      ],
    },
    {
      slug:        'kids-party',
      name:        'Kids Party',
      emoji:       '🎈',
      description: 'Everything needed for a fun-filled, stress-free children\'s party the little ones will love.',
      steps: [
        { title: 'Order Fun Birthday Cake',      category: TaskCategory.CAKE,               sortOrder: 1 },
        { title: 'Put Up Colourful Decorations', category: TaskCategory.DECORATIONS,        sortOrder: 2 },
        { title: 'Arrange Party Food & Snacks',  category: TaskCategory.FOOD,               sortOrder: 3 },
        { title: 'Book Kids Entertainer',        category: TaskCategory.ENTERTAINMENT,      sortOrder: 4 },
        { title: 'Plan Games & Activities',      category: TaskCategory.GAMES_AND_ACTIVITIES, sortOrder: 5 },
        { title: 'Prepare Party Favours',        category: TaskCategory.PARTY_FAVORS,       sortOrder: 6 },
        { title: 'Hire Photographer',            category: TaskCategory.PHOTOGRAPHY,        sortOrder: 7 },
      ],
    },
  ];

  for (const tmpl of templates) {
    const { steps, ...rest } = tmpl;
    const existing = await prisma.template.findUnique({ where: { slug: rest.slug } });
    if (!existing) {
      await prisma.template.create({
        data: {
          ...rest,
          steps: { create: steps },
        },
      });
      console.log(`  ✓ Template: ${rest.name}`);
    } else {
      console.log(`  – Template already exists: ${rest.name}`);
    }
  }

  // ── Products ────────────────────────────────────────────────────────────────
  const products: {
    sku: string;
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    venueAddress?: string;
  }[] = [
    // CAKES
    {
      sku: 'CAKE-001',
      name: 'Classic Birthday Cake',
      description: 'Three-tier vanilla sponge with buttercream frosting and custom message.',
      category: ProductCategory.CAKES,
      price: 120,
    },
    {
      sku: 'CAKE-002',
      name: 'Chocolate Ganache Cake',
      description: 'Rich chocolate layers with dark ganache and fondant decorations.',
      category: ProductCategory.CAKES,
      price: 150,
    },
    {
      sku: 'CAKE-003',
      name: 'Floral Celebration Cake',
      description: 'Elegant white cake adorned with hand-crafted sugar flowers.',
      category: ProductCategory.CAKES,
      price: 200,
    },

    // DECORATIONS
    {
      sku: 'DECO-001',
      name: 'Balloon Arch Package',
      description: 'Custom balloon arch with 100+ latex & foil balloons in your colour theme.',
      category: ProductCategory.DECORATIONS,
      price: 180,
    },
    {
      sku: 'DECO-002',
      name: 'Floral Centrepiece Set (×5)',
      description: 'Five premium floral centrepieces with seasonal blooms and greenery.',
      category: ProductCategory.DECORATIONS,
      price: 250,
    },
    {
      sku: 'DECO-003',
      name: 'Fairy Light Canopy',
      description: 'Warm-white LED fairy light canopy to transform any ceiling.',
      category: ProductCategory.DECORATIONS,
      price: 320,
    },

    // FOOD
    {
      sku: 'FOOD-001',
      name: 'Cocktail Canapés Platter',
      description: 'Assorted bite-sized canapés for up to 30 guests, served by waitstaff.',
      category: ProductCategory.FOOD,
      price: 350,
    },
    {
      sku: 'FOOD-002',
      name: 'Buffet Package (50 Guests)',
      description: 'Three-course buffet with salads, mains, and desserts for 50 guests.',
      category: ProductCategory.FOOD,
      price: 1200,
    },
    {
      sku: 'FOOD-003',
      name: 'Premium Bar Package',
      description: 'Full-service bar with mixologist, spirits, wines, and soft drinks for 4 hours.',
      category: ProductCategory.FOOD,
      price: 800,
    },

    // GIFTS
    {
      sku: 'GIFT-001',
      name: 'Luxury Gift Hamper',
      description: 'Curated hamper with gourmet treats, candles, and personalised keepsakes.',
      category: ProductCategory.GIFTS,
      price: 95,
    },
    {
      sku: 'GIFT-002',
      name: 'Party Favour Set (×30)',
      description: 'Elegant favour boxes with ribbon and personalised tags for 30 guests.',
      category: ProductCategory.GIFTS,
      price: 120,
    },

    // PHOTOGRAPHY
    {
      sku: 'PHOTO-001',
      name: 'Event Photography (4 Hours)',
      description: 'Professional photographer with edited gallery of 200+ high-res images.',
      category: ProductCategory.PHOTOGRAPHY,
      price: 600,
    },
    {
      sku: 'PHOTO-002',
      name: 'Photo Booth Hire',
      description: 'Retro-style photo booth with unlimited prints and digital copies.',
      category: ProductCategory.PHOTOGRAPHY,
      price: 450,
    },
    {
      sku: 'PHOTO-003',
      name: 'Videography Package',
      description: 'Full-event videography with cinematic highlight reel (3–5 mins).',
      category: ProductCategory.PHOTOGRAPHY,
      price: 850,
    },

    // ENTERTAINMENT
    {
      sku: 'ENT-001',
      name: 'DJ & Sound System',
      description: 'Professional DJ with premium sound system and lighting rig for 4 hours.',
      category: ProductCategory.ENTERTAINMENT,
      price: 700,
    },
    {
      sku: 'ENT-002',
      name: 'Live Acoustic Duo',
      description: 'Talented acoustic guitar and vocals duo performing 2 sets.',
      category: ProductCategory.ENTERTAINMENT,
      price: 550,
    },

    // VENUE
    {
      sku: 'VENUE-001',
      name: 'The Grand Ballroom',
      description: 'Stunning ballroom with chandeliers, parquet floor, and capacity for 200 guests.',
      category: ProductCategory.VENUE,
      price: 3500,
      venueAddress: '1 Celebration Boulevard, Luxury Quarter',
    },
    {
      sku: 'VENUE-002',
      name: 'Rooftop Garden Terrace',
      description: 'Open-air rooftop with city views, lush greenery, and bar area for 80 guests.',
      category: ProductCategory.VENUE,
      price: 2200,
      venueAddress: '42 Skyline Drive, City Centre',
    },
    {
      sku: 'VENUE-003',
      name: 'Intimate Private Dining Room',
      description: 'Elegant private dining room with fireplace for up to 30 guests.',
      category: ProductCategory.VENUE,
      price: 1200,
      venueAddress: '8 Heritage Lane, Old Town',
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      await prisma.product.create({ data: p });
      console.log(`  ✓ Product: ${p.name}`);
    } else {
      console.log(`  – Product already exists: ${p.name}`);
    }
  }

  // ── Packages ────────────────────────────────────────────────────────────────
  // Look up products by SKU so we can reference them in package items
  const bySkus = async (skus: string[]) => {
    const rows = await prisma.product.findMany({ where: { sku: { in: skus } }, select: { id: true, sku: true } });
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.sku] = r.id; });
    return map;
  };

  type PkgDef = {
    name: string; eventType: string; tier: string;
    description: string; highlights: string[];
    items: { sku: string; quantity: number; isCore: boolean; sortOrder: number }[];
  };

  const PACKAGES: PkgDef[] = [
    // ── Birthday ──────────────────────────────────────────────────────────────
    {
      name: 'Birthday Bronze', eventType: 'BIRTHDAY', tier: 'BRONZE',
      description: 'The essential birthday package — everything you need for a great celebration.',
      highlights: ['Classic birthday cake', 'Full balloon arch', 'Canapés for 30 guests'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'FOOD-001', quantity: 1, isCore: true,  sortOrder: 3 },
      ],
    },
    {
      name: 'Birthday Silver', eventType: 'BIRTHDAY', tier: 'SILVER',
      description: 'A complete birthday experience with photography and live entertainment.',
      highlights: ['Everything in Bronze', '4-hour professional photography', 'DJ & full sound system'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'FOOD-001', quantity: 1, isCore: true,  sortOrder: 3 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true,  sortOrder: 4 },
        { sku: 'ENT-001',  quantity: 1, isCore: true,  sortOrder: 5 },
      ],
    },
    {
      name: 'Birthday Gold', eventType: 'BIRTHDAY', tier: 'GOLD',
      description: 'The ultimate luxury birthday — stunning venue, full catering, and premium entertainment.',
      highlights: ['Everything in Silver', 'Grand Ballroom venue', 'Full buffet for 50 guests', 'Floral centrepieces'],
      items: [
        { sku: 'CAKE-002', quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'DECO-002', quantity: 1, isCore: false, sortOrder: 3 },
        { sku: 'FOOD-002', quantity: 1, isCore: true,  sortOrder: 4 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true,  sortOrder: 5 },
        { sku: 'ENT-001',  quantity: 1, isCore: true,  sortOrder: 6 },
        { sku: 'VENUE-001',quantity: 1, isCore: true,  sortOrder: 7 },
      ],
    },

    // ── Proposal ──────────────────────────────────────────────────────────────
    {
      name: 'Proposal Bronze', eventType: 'PROPOSAL', tier: 'BRONZE',
      description: 'A beautifully intimate setup to pop the question in style.',
      highlights: ['Romantic balloon arch', 'Floral centrepieces', 'Premium bar service'],
      items: [
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-002', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-003', quantity: 1, isCore: true, sortOrder: 3 },
      ],
    },
    {
      name: 'Proposal Silver', eventType: 'PROPOSAL', tier: 'SILVER',
      description: 'Capture the perfect moment with a professional photographer and live music.',
      highlights: ['Everything in Bronze', 'Professional photographer', 'Live acoustic duo'],
      items: [
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-002', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-003', quantity: 1, isCore: true, sortOrder: 3 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true, sortOrder: 4 },
        { sku: 'ENT-002',  quantity: 1, isCore: true, sortOrder: 5 },
      ],
    },
    {
      name: 'Proposal Gold', eventType: 'PROPOSAL', tier: 'GOLD',
      description: 'An unforgettable proposal in a stunning private venue — every detail perfected.',
      highlights: ['Everything in Silver', 'Private dining room', 'Fairy light canopy', 'Full videography'],
      items: [
        { sku: 'VENUE-003',quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'DECO-002', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'DECO-003', quantity: 1, isCore: true,  sortOrder: 3 },
        { sku: 'FOOD-003', quantity: 1, isCore: true,  sortOrder: 4 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true,  sortOrder: 5 },
        { sku: 'PHOTO-003',quantity: 1, isCore: false, sortOrder: 6 },
        { sku: 'ENT-002',  quantity: 1, isCore: true,  sortOrder: 7 },
      ],
    },

    // ── Wedding ───────────────────────────────────────────────────────────────
    {
      name: 'Wedding Bronze', eventType: 'WEDDING', tier: 'BRONZE',
      description: 'An elegant wedding foundation — beautiful cake, floral décor, and a hearty buffet.',
      highlights: ['Floral celebration cake', 'Floral centrepieces', 'Buffet for 50 guests'],
      items: [
        { sku: 'CAKE-003', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-002', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-002', quantity: 1, isCore: true, sortOrder: 3 },
      ],
    },
    {
      name: 'Wedding Silver', eventType: 'WEDDING', tier: 'SILVER',
      description: 'A memorable wedding with full photography, live DJ, and magical fairy lights.',
      highlights: ['Everything in Bronze', 'Full day photography', 'DJ & sound system', 'Fairy light canopy'],
      items: [
        { sku: 'CAKE-003', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-002', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'DECO-003', quantity: 1, isCore: true, sortOrder: 3 },
        { sku: 'FOOD-002', quantity: 1, isCore: true, sortOrder: 4 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true, sortOrder: 5 },
        { sku: 'ENT-001',  quantity: 1, isCore: true, sortOrder: 6 },
      ],
    },
    {
      name: 'Wedding Gold', eventType: 'WEDDING', tier: 'GOLD',
      description: 'The complete luxury wedding — grand ballroom, cinematic video, and live music.',
      highlights: ['Everything in Silver', 'Grand Ballroom venue', 'Full-day photo & video', 'Live music duo', 'Premium bar'],
      items: [
        { sku: 'VENUE-001',quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'CAKE-003', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'DECO-002', quantity: 1, isCore: true,  sortOrder: 3 },
        { sku: 'DECO-003', quantity: 1, isCore: true,  sortOrder: 4 },
        { sku: 'FOOD-002', quantity: 1, isCore: true,  sortOrder: 5 },
        { sku: 'FOOD-003', quantity: 1, isCore: false, sortOrder: 6 },
        { sku: 'PHOTO-002',quantity: 1, isCore: true,  sortOrder: 7 },
        { sku: 'PHOTO-003',quantity: 1, isCore: true,  sortOrder: 8 },
        { sku: 'ENT-002',  quantity: 1, isCore: true,  sortOrder: 9 },
      ],
    },

    // ── Baby Shower ───────────────────────────────────────────────────────────
    {
      name: 'Baby Shower Bronze', eventType: 'BABY_SHOWER', tier: 'BRONZE',
      description: 'A warm and joyful baby shower with themed décor, cake, and treats.',
      highlights: ['Themed birthday cake', 'Balloon arch', 'Canapé platter'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-001', quantity: 1, isCore: true, sortOrder: 3 },
      ],
    },
    {
      name: 'Baby Shower Silver', eventType: 'BABY_SHOWER', tier: 'SILVER',
      description: 'A fully decorated baby shower with photography and party favours for every guest.',
      highlights: ['Everything in Bronze', 'Professional photographer', 'Party favours for 30'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'DECO-002', quantity: 1, isCore: true, sortOrder: 3 },
        { sku: 'FOOD-001', quantity: 1, isCore: true, sortOrder: 4 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true, sortOrder: 5 },
        { sku: 'GIFT-002', quantity: 1, isCore: true, sortOrder: 6 },
      ],
    },
    {
      name: 'Baby Shower Gold', eventType: 'BABY_SHOWER', tier: 'GOLD',
      description: 'A luxurious baby shower in a private venue with fairy lights and full catering.',
      highlights: ['Everything in Silver', 'Private dining room', 'Fairy light canopy', 'Full buffet'],
      items: [
        { sku: 'VENUE-003',quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'CAKE-002', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'DECO-001', quantity: 1, isCore: true,  sortOrder: 3 },
        { sku: 'DECO-002', quantity: 1, isCore: true,  sortOrder: 4 },
        { sku: 'DECO-003', quantity: 1, isCore: false, sortOrder: 5 },
        { sku: 'FOOD-002', quantity: 1, isCore: true,  sortOrder: 6 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true,  sortOrder: 7 },
        { sku: 'GIFT-002', quantity: 1, isCore: true,  sortOrder: 8 },
      ],
    },

    // ── Kids Party ────────────────────────────────────────────────────────────
    {
      name: 'Kids Party Bronze', eventType: 'KIDS_PARTY', tier: 'BRONZE',
      description: 'Fun, colourful and delicious — the essentials for a great kids party.',
      highlights: ['Fun birthday cake', 'Balloon arch', 'Party food platter'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-001', quantity: 1, isCore: true, sortOrder: 3 },
      ],
    },
    {
      name: 'Kids Party Silver', eventType: 'KIDS_PARTY', tier: 'SILVER',
      description: 'A fully loaded kids party with entertainer, photography, and party favours.',
      highlights: ['Everything in Bronze', 'Professional kids entertainer', 'Photographer', 'Party favours'],
      items: [
        { sku: 'CAKE-001', quantity: 1, isCore: true, sortOrder: 1 },
        { sku: 'DECO-001', quantity: 1, isCore: true, sortOrder: 2 },
        { sku: 'FOOD-001', quantity: 1, isCore: true, sortOrder: 3 },
        { sku: 'ENT-002',  quantity: 1, isCore: true, sortOrder: 4 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true, sortOrder: 5 },
        { sku: 'GIFT-002', quantity: 1, isCore: true, sortOrder: 6 },
      ],
    },
    {
      name: 'Kids Party Gold', eventType: 'KIDS_PARTY', tier: 'GOLD',
      description: 'The ultimate kids party experience — venue, entertainer, DJ, and all the extras.',
      highlights: ['Everything in Silver', 'Rooftop garden venue', 'DJ & sound system', 'Photo booth'],
      items: [
        { sku: 'VENUE-002',quantity: 1, isCore: true,  sortOrder: 1 },
        { sku: 'CAKE-002', quantity: 1, isCore: true,  sortOrder: 2 },
        { sku: 'DECO-001', quantity: 1, isCore: true,  sortOrder: 3 },
        { sku: 'DECO-002', quantity: 1, isCore: false, sortOrder: 4 },
        { sku: 'FOOD-002', quantity: 1, isCore: true,  sortOrder: 5 },
        { sku: 'ENT-002',  quantity: 1, isCore: true,  sortOrder: 6 },
        { sku: 'ENT-001',  quantity: 1, isCore: false, sortOrder: 7 },
        { sku: 'PHOTO-001',quantity: 1, isCore: true,  sortOrder: 8 },
        { sku: 'PHOTO-002',quantity: 1, isCore: false, sortOrder: 9 },
        { sku: 'GIFT-002', quantity: 1, isCore: true,  sortOrder: 10 },
      ],
    },
  ];

  let pkgCount = 0;
  for (const pkg of PACKAGES) {
    const existing = await prisma.package.findUnique({
      where: { eventType_tier: { eventType: pkg.eventType, tier: pkg.tier as any } },
    });
    if (existing) { console.log(`  – Package already exists: ${pkg.name}`); continue; }

    const skus = pkg.items.map(i => i.sku);
    const productMap = await bySkus(skus);
    const missingSkus = skus.filter(s => !productMap[s]);
    if (missingSkus.length) {
      console.warn(`  ⚠ Skipping ${pkg.name} — missing product SKUs: ${missingSkus.join(', ')}`);
      continue;
    }

    await prisma.package.create({
      data: {
        name:        pkg.name,
        eventType:   pkg.eventType,
        tier:        pkg.tier as any,
        description: pkg.description,
        highlights:  pkg.highlights,
        isActive:    true,
        items: {
          create: pkg.items.map(item => ({
            productId: productMap[item.sku],
            quantity:  item.quantity,
            isCore:    item.isCore,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });
    console.log(`  ✓ Package: ${pkg.name}`);
    pkgCount++;
  }
  console.log(`\n  ${pkgCount} packages seeded.`);

  console.log('\nSeeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
