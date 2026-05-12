import { useMemo, useState } from 'react';
import { AppScreen, CartItem, EventData } from '@/App';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ShoppingCart } from 'lucide-react';

const SHOP_PRODUCTS = [
  // Cakes
  { id: 'cake-1', name: 'Chocolate Cake', price: 45, category: 'Cakes', image: '' },
  { id: 'cake-2', name: 'Vanilla Cake', price: 40, category: 'Cakes', image: '' },
  { id: 'cake-3', name: 'Strawberry Cake', price: 50, category: 'Cakes', image: '' },
  // Decorations
  { id: 'dec-1', name: 'Balloon Set', price: 25, category: 'Decorations', image: '' },
  { id: 'dec-2', name: 'Streamers & Banners', price: 15, category: 'Decorations', image: '' },
  { id: 'dec-3', name: 'Table Centerpieces', price: 35, category: 'Decorations', image: '' },
  // Food
  { id: 'food-1', name: 'Catering Package', price: 150, category: 'Food', image: '' },
  { id: 'food-2', name: 'Appetizer Platter', price: 60, category: 'Food', image: '' },
  { id: 'food-3', name: 'Dessert Assortment', price: 40, category: 'Food', image: '' },
  // Gifts
  { id: 'gift-1', name: 'Premium Gift Basket', price: 75, category: 'Gifts', image: '' },
  { id: 'gift-2', name: 'Personalized Gift Box', price: 55, category: 'Gifts', image: '' },
  // Photography
  { id: 'photo-1', name: 'Photo Package', price: 200, category: 'Photography', image: '' },
  { id: 'photo-2', name: 'Video Highlights', price: 150, category: 'Photography', image: '' },
  // Entertainment
  { id: 'ent-1', name: 'DJ Service', price: 300, category: 'Entertainment', image: '' },
  { id: 'ent-2', name: 'Party Games Package', price: 40, category: 'Entertainment', image: '' },
  // Venue
  { id: 'venue-1', name: 'Indoor Venue Booking', price: 500, category: 'Venue', image: '', description: 'Air-conditioned indoor venue with capacity for 100 guests', venueAddress: 'CelebrateSmart Indoor Hall, 245 Celebration Avenue, Downtown District' },
  { id: 'venue-2', name: 'Outdoor Venue Booking', price: 600, category: 'Venue', image: '', description: 'Beautiful garden setting with capacity for 150 guests', venueAddress: 'CelebrateSmart Garden Venue, 789 Paradise Gardens, Riverside Park' },
];

interface ShopScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onAddToCart: (item: CartItem) => void;
  event: EventData | null;
  returnToPlanning: boolean;
  initialCategory: string | null;
}

export function ShopScreen({ onAddToCart, event, returnToPlanning, initialCategory }: ShopScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low');

  const handleAddToCart = (item: CartItem) => {
    onAddToCart(item);
    toast({
      title: 'Added to cart',
      description: item.name,
    });
  };

  const categories = [...new Set(SHOP_PRODUCTS.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    let products = SHOP_PRODUCTS;
    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory);
    }

    if (sortBy === 'price-low') {
      return [...products].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-high') {
      return [...products].sort((a, b) => b.price - a.price);
    }
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCategory, sortBy]);

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='w-full lg:w-64 shrink-0'>
            <Card className='sticky top-4'>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Browse by what you need.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-1'>
                  <Button
                    variant={selectedCategory === null ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategory(null)}
                    className='w-full justify-start font-semibold'
                  >
                    All Items
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'ghost'}
                      onClick={() => setSelectedCategory(cat)}
                      className='w-full justify-start font-semibold'
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-foreground'>Sort</p>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Sort by' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='price-low'>Price (low → high)</SelectItem>
                      <SelectItem value='price-high'>Price (high → low)</SelectItem>
                      <SelectItem value='name'>Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className='flex-1 min-w-0'>
            {returnToPlanning && event && (
              <Alert className='mb-6 border-primary/30 bg-primary/5'>
                <Info />
                <AlertTitle className='text-primary'>Shopping for: {event.name}</AlertTitle>
                <AlertDescription>
                  Items added will automatically mark planning tasks as complete.
                </AlertDescription>
              </Alert>
            )}
            <div className='mb-6'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-muted-foreground'>Showing {filteredProducts.length} products</p>
                {selectedCategory && (
                  <Badge variant='outline'>{selectedCategory}</Badge>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {filteredProducts.map(product => (
                <Card key={product.id} className='overflow-hidden transition-shadow hover:shadow-md'>
                  <div className='bg-muted/50 p-8 text-5xl flex items-center justify-center h-40'>
                    {product.image || '🛍️'}
                  </div>
                  <CardContent className='p-6 space-y-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <Badge variant='outline' className='mb-2'>
                          {product.category}
                        </Badge>
                        <h3 className='font-bold text-lg text-foreground leading-tight'>
                          {product.name}
                        </h3>
                      </div>
                      <span className='text-xl font-bold text-primary whitespace-nowrap'>
                        ${product.price}
                      </span>
                    </div>

                    {(product as any).description && (
                      <p className='text-sm text-muted-foreground'>
                        {(product as any).description}
                      </p>
                    )}
                    {(product as any).venueAddress && (
                      <p className='text-xs text-muted-foreground'>
                        <span className='font-medium text-foreground'>Address:</span>{' '}
                        <span>{(product as any).venueAddress}</span>
                      </p>
                    )}

                    <Button
                      onClick={() =>
                        handleAddToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          quantity: 1,
                          category: product.category,
                          image: product.image,
                          ...(product as any).venueAddress && {
                            venueAddress: (product as any).venueAddress,
                          },
                        } as any)
                      }
                      className='w-full font-semibold'
                    >
                      <ShoppingCart className='size-4' />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
