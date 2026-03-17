import { useState, useEffect } from 'react';
import { AppScreen, CartItem, EventData } from '@/App';
import { CheckCircle } from 'lucide-react';

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

export function ShopScreen({ onNavigate, onAddToCart, event, returnToPlanning, initialCategory }: ShopScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low');
  const [toast, setToast] = useState<{ show: boolean; message: string; productName: string }>({ 
    show: false, 
    message: '', 
    productName: '' 
  });

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', productName: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleAddToCart = (item: CartItem) => {
    onAddToCart(item);
    setToast({ 
      show: true, 
      message: 'Added to Cart!', 
      productName: item.name 
    });
  };

  const categories = [...new Set(SHOP_PRODUCTS.map(p => p.category))];

  let filteredProducts = SHOP_PRODUCTS;
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Toast Notification */}
      {toast.show && (
        <div className='fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300'>
          <div className='bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px]'>
            <CheckCircle className='w-6 h-6 flex-shrink-0' />
            <div>
              <p className='font-bold'>{toast.message}</p>
              <p className='text-sm text-green-100'>{toast.productName}</p>
            </div>
          </div>
        </div>
      )}

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='w-full lg:w-64 shrink-0'>
            <div className='bg-card border border-border rounded-lg p-6 sticky top-4'>
              <h3 className='font-bold text-lg mb-4'>Categories</h3>
              <div className='space-y-2'>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <h3 className='font-bold text-lg mt-6 mb-4'>Sort By</h3>
              <div className='space-y-2'>
                {(['price-low', 'price-high', 'name'] as const).map(option => (
                  <label key={option} className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      checked={sortBy === option}
                      onChange={() => setSortBy(option)}
                      className='w-4 h-4'
                    />
                    <span className='text-sm capitalize'>{option.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className='flex-1 min-w-0'>
            {returnToPlanning && event && (
              <div className='mb-6 p-4 bg-purple-100 border border-purple-300 rounded-lg'>
                <p className='font-semibold text-purple-900'>Shopping for: {event.name}</p>
                <p className='text-sm text-purple-700'>Items added will automatically mark planning tasks as complete</p>
              </div>
            )}
            <div className='mb-6'>
              <p className='text-muted-foreground'>Showing {filteredProducts.length} products</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {filteredProducts.map(product => (
                <div key={product.id} className='bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow'>
                  <div className='bg-muted p-8 text-5xl flex items-center justify-center h-40'>
                    {product.image}
                  </div>
                  <div className='p-6'>
                    <p className='text-xs text-muted-foreground uppercase mb-1'>{product.category}</p>
                    <h3 className='font-bold text-lg mb-3'>{product.name}</h3>
                    {(product as any).description && (
                      <p className='text-sm text-muted-foreground mb-3'>{(product as any).description}</p>
                    )}
                    {(product as any).venueAddress && (
                      <p className='text-xs text-muted-foreground mb-3 flex items-start gap-1'>
                        <span>Address:</span>
                        <span>{(product as any).venueAddress}</span>
                      </p>
                    )}
                    <div className='flex items-center justify-between'>
                      <span className='text-2xl font-bold text-primary'>${product.price}</span>
                      <button
                        onClick={() => handleAddToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          quantity: 1,
                          category: product.category,
                          image: product.image,
                          ...(product as any).venueAddress && { venueAddress: (product as any).venueAddress }
                        } as any)}
                        className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
