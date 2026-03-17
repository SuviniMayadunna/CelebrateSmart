const { PrismaClient, TaskCategory, ProductCategory } = require('@prisma/client');

const prisma = new PrismaClient();

const TEMPLATE_DEFINITIONS = [
  {
    slug: 'birthday',
    name: 'Birthday Party',
    emoji: '🎂',
    description: 'Celebrate a birthday with cake, decorations, and fun',
    steps: [
      { title: 'Cake', category: TaskCategory.CAKE },
      { title: 'Decorations', category: TaskCategory.DECORATIONS },
      { title: 'Food', category: TaskCategory.FOOD },
      { title: 'Entertainment', category: TaskCategory.ENTERTAINMENT },
      { title: 'Photography', category: TaskCategory.PHOTOGRAPHY },
      { title: 'Gifts', category: TaskCategory.GIFTS },
    ],
  },
  {
    slug: 'proposal',
    name: 'Proposal',
    emoji: '💍',
    description: 'Plan the perfect proposal moment',
    steps: [
      { title: 'Venue', category: TaskCategory.VENUE },
      { title: 'Flowers', category: TaskCategory.FLOWERS },
      { title: 'Decorations', category: TaskCategory.DECORATIONS },
      { title: 'Photography', category: TaskCategory.PHOTOGRAPHY },
      { title: 'Entertainment', category: TaskCategory.ENTERTAINMENT },
      { title: 'Celebration Dinner', category: TaskCategory.CELEBRATION_DINNER },
    ],
  },
  {
    slug: 'baby-shower',
    name: 'Baby Shower',
    emoji: '🍼',
    description: 'Celebrate the upcoming arrival with loved ones',
    steps: [
      { title: 'Cake', category: TaskCategory.CAKE },
      { title: 'Decorations', category: TaskCategory.DECORATIONS },
      { title: 'Games', category: TaskCategory.GAMES },
      { title: 'Food & Drinks', category: TaskCategory.FOOD },
      { title: 'Party Favors', category: TaskCategory.PARTY_FAVORS },
      { title: 'Gifts', category: TaskCategory.GIFTS },
    ],
  },
  {
    slug: 'bride-to-be',
    name: 'Bride-to-Be Party',
    emoji: '👰',
    description: 'Celebrate the bride before the big day',
    steps: [
      { title: 'Cake', category: TaskCategory.CAKE },
      { title: 'Decorations', category: TaskCategory.DECORATIONS },
      { title: 'Games & Activities', category: TaskCategory.GAMES_AND_ACTIVITIES },
      { title: 'Food', category: TaskCategory.FOOD },
      { title: 'Entertainment', category: TaskCategory.ENTERTAINMENT },
      { title: 'Gifts', category: TaskCategory.GIFTS },
    ],
  },
];

const PRODUCTS = [
  { sku: 'cake-1', name: 'Chocolate Cake', price: 45, category: ProductCategory.CAKES },
  { sku: 'cake-2', name: 'Vanilla Cake', price: 40, category: ProductCategory.CAKES },
  { sku: 'cake-3', name: 'Strawberry Cake', price: 50, category: ProductCategory.CAKES },

  { sku: 'dec-1', name: 'Balloon Set', price: 25, category: ProductCategory.DECORATIONS },
  { sku: 'dec-2', name: 'Streamers & Banners', price: 15, category: ProductCategory.DECORATIONS },
  { sku: 'dec-3', name: 'Table Centerpieces', price: 35, category: ProductCategory.DECORATIONS },

  { sku: 'food-1', name: 'Catering Package', price: 150, category: ProductCategory.FOOD },
  { sku: 'food-2', name: 'Appetizer Platter', price: 60, category: ProductCategory.FOOD },
  { sku: 'food-3', name: 'Dessert Assortment', price: 40, category: ProductCategory.FOOD },

  { sku: 'gift-1', name: 'Premium Gift Basket', price: 75, category: ProductCategory.GIFTS },
  { sku: 'gift-2', name: 'Personalized Gift Box', price: 55, category: ProductCategory.GIFTS },

  { sku: 'photo-1', name: 'Photo Package', price: 200, category: ProductCategory.PHOTOGRAPHY },
  { sku: 'photo-2', name: 'Video Highlights', price: 150, category: ProductCategory.PHOTOGRAPHY },

  { sku: 'ent-1', name: 'DJ Service', price: 300, category: ProductCategory.ENTERTAINMENT },
  { sku: 'ent-2', name: 'Party Games Package', price: 40, category: ProductCategory.ENTERTAINMENT },

  {
    sku: 'venue-1',
    name: 'Indoor Venue Booking',
    description: 'Air-conditioned indoor venue with capacity for 100 guests',
    venueAddress: 'CelebrateSmart Indoor Hall, 245 Celebration Avenue, Downtown District',
    price: 500,
    category: ProductCategory.VENUE,
  },
  {
    sku: 'venue-2',
    name: 'Outdoor Venue Booking',
    description: 'Beautiful garden setting with capacity for 150 guests',
    venueAddress: 'CelebrateSmart Garden Venue, 789 Paradise Gardens, Riverside Park',
    price: 600,
    category: ProductCategory.VENUE,
  },
];

async function seedTemplates() {
  for (const templateDef of TEMPLATE_DEFINITIONS) {
    const template = await prisma.template.upsert({
      where: { slug: templateDef.slug },
      update: {
        name: templateDef.name,
        emoji: templateDef.emoji,
        description: templateDef.description,
        isActive: true,
      },
      create: {
        slug: templateDef.slug,
        name: templateDef.name,
        emoji: templateDef.emoji,
        description: templateDef.description,
      },
    });

    await prisma.templateStep.deleteMany({ where: { templateId: template.id } });

    await prisma.templateStep.createMany({
      data: templateDef.steps.map((step, index) => ({
        templateId: template.id,
        title: step.title,
        category: step.category,
        sortOrder: index + 1,
      })),
    });
  }
}

async function seedProducts() {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description ?? null,
        venueAddress: product.venueAddress ?? null,
        category: product.category,
        price: product.price,
        isActive: true,
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description ?? null,
        venueAddress: product.venueAddress ?? null,
        category: product.category,
        price: product.price,
      },
    });
  }
}

async function main() {
  console.log('🌱 Seeding CelebrateSmart Day 1 data...');

  await seedTemplates();
  await seedProducts();

  console.log('✅ Seed complete: templates and products are ready.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
