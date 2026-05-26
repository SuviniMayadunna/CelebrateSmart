import { useEffect, useMemo, useState } from 'react';
import { AppScreen, CartItem, EventData } from '@/App';
import { productsAPI, type Product } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Spinner } from '@/components/ui/spinner';
import { Info, Search, ShoppingCart, X } from 'lucide-react';

const CATEGORY_EMOJI: Record<string, string> = {
  CAKES: '🎂',
  DECORATIONS: '🎈',
  FOOD: '🍽️',
  GIFTS: '🎁',
  PHOTOGRAPHY: '📷',
  ENTERTAINMENT: '🎵',
  VENUE: '🏛️',
};

interface ShopScreenProps {
  onNavigate: (screen: AppScreen) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  event: EventData | null;
  returnToPlanning: boolean;
  initialCategory: string | null;
  cartItems: CartItem[];
}

export function ShopScreen({ onAddToCart, event, returnToPlanning, initialCategory }: ShopScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low');

  useEffect(() => {
    setLoading(true);
    productsAPI.list()
      .then(r => setProducts(r.data.products.filter(p => p.isActive)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, 1);
    toast({
      title: 'Added to cart',
      description: product.name,
    });
  };

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(p => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'price-low') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return [...list].sort((a, b) => b.price - a.price);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategory, search, sortBy]);

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
                      {CATEGORY_EMOJI[cat] ?? '🛍️'} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className='space-y-2'>
                  <p className='text-sm font-semibold text-foreground'>Sort</p>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
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

            {/* Search bar */}
            <div className='mb-6 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search products…'
                className='pl-9 pr-9'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  aria-label='Clear search'
                >
                  <X className='size-4' />
                </button>
              )}
            </div>

            <div className='mb-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                {loading ? (
                  <p className='text-muted-foreground'>Loading products…</p>
                ) : (
                  <p className='text-muted-foreground'>Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
                )}
                {selectedCategory && (
                  <Badge variant='outline'>{selectedCategory}</Badge>
                )}
              </div>
            </div>

            {loading ? (
              <div className='flex items-center justify-center py-24'>
                <Spinner className='size-8' />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='flex items-center justify-center py-24'>
                <p className='text-muted-foreground text-lg'>No products match your search.</p>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {filteredProducts.map(product => (
                  <Card key={product.id} className='overflow-hidden transition-shadow hover:shadow-md'>
                    <div className='bg-muted/50 p-8 text-5xl flex items-center justify-center h-40'>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        CATEGORY_EMOJI[product.category] ?? '🛍️'
                      )}
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

                      {product.description && (
                        <p className='text-sm text-muted-foreground'>
                          {product.description}
                        </p>
                      )}
                      {product.venueAddress && (
                        <p className='text-xs text-muted-foreground'>
                          <span className='font-medium text-foreground'>Address:</span>{' '}
                          <span>{product.venueAddress}</span>
                        </p>
                      )}

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className='w-full font-semibold'
                      >
                        <ShoppingCart className='size-4' />
                        Add to Cart
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
