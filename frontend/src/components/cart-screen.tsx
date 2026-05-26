import { AppScreen, CartItem, EventData } from '@/App';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

interface CartScreenProps {
  cart: CartItem[];
  event: EventData | null;
  onNavigate: (screen: AppScreen) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export function CartScreen({
  cart,
  event,
  onNavigate,
  onRemoveItem,
  onUpdateQuantity,
}: CartScreenProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            {event && (
              <Card className='mb-8'>
                <CardHeader>
                  <CardTitle>Event: {event.name}</CardTitle>
                  <CardDescription className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='capitalize'>
                      {event.type}
                    </Badge>
                    <span className='inline-flex items-center gap-1'>
                      <Calendar className='size-4' /> {event.date}
                    </span>
                    <span className='inline-flex items-center gap-1'>
                      <MapPin className='size-4' /> {event.venueBooked || event.venue}
                    </span>
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {cart.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant='icon'>
                    <ShoppingBag />
                  </EmptyMedia>
                  <EmptyTitle>Your cart is empty</EmptyTitle>
                  <EmptyDescription>
                    Browse the shop and add items to build your event.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => onNavigate('shop')} className='w-full font-semibold'>
                    Continue shopping
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className='space-y-4'>
                {cart.map(item => (
                  <Card key={item.id}>
                    <CardContent className='p-6 space-y-4'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex items-center gap-4 min-w-0'>
                          <div className='text-4xl shrink-0'>{item.product.imageUrl || '🛍️'}</div>
                          <div className='min-w-0'>
                            <h3 className='font-bold text-lg text-foreground truncate'>{item.product.name}</h3>
                            <Badge variant='outline'>{item.product.category}</Badge>
                          </div>
                        </div>
                        <p className='font-bold text-lg whitespace-nowrap'>${item.product.price}</p>
                      </div>

                      <Separator />

                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div className='inline-flex items-center gap-2 bg-muted/50 rounded-md p-1 w-fit'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            aria-label='Decrease quantity'
                          >
                            <Minus className='size-4' />
                          </Button>
                          <span className='px-3 font-semibold min-w-12 text-center'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            aria-label='Increase quantity'
                          >
                            <Plus className='size-4' />
                          </Button>
                        </div>

                        <div className='flex items-center justify-between sm:justify-end gap-4'>
                          <div className='text-right'>
                            <p className='text-sm text-muted-foreground'>Subtotal</p>
                            <p className='font-bold text-lg'>
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>

                          <Button
                            variant='ghost'
                            className='text-destructive hover:text-destructive'
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className='size-4' />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <Card className='sticky top-24'>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review totals before checkout.</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>

              <div className='space-y-3 pb-6 border-b border-border'>
                <div className='flex justify-between text-sm'>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className='flex justify-between items-center mb-6'>
                <span className='font-bold text-lg'>Total</span>
                <span className='text-2xl font-bold text-primary'>${total.toFixed(2)}</span>
              </div>

              {cart.length > 0 && (
                <Button
                  onClick={() => onNavigate('checkout')}
                  className='w-full font-semibold'
                  size='lg'
                >
                  Proceed to Checkout
                </Button>
              )}

              <Button
                onClick={() => onNavigate('shop')}
                variant='secondary'
                className='w-full font-semibold'
                size='lg'
              >
                Continue Shopping
              </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
