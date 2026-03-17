import { AppScreen, CartItem, EventData } from '@/app/page';

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
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            {event && (
              <div className='bg-card border border-border rounded-lg p-6 mb-8'>
                <h2 className='font-bold text-lg mb-4'>Event: {event.name}</h2>
                <p className='text-sm text-muted-foreground'>
                  {event.type} • {event.date} • {event.venue}
                </p>
              </div>
            )}

            {cart.length === 0 ? (
              <div className='text-center py-12 border border-dashed border-border rounded-lg'>
                <p className='text-2xl mb-4'>🛒</p>
                <p className='text-muted-foreground mb-4'>Your cart is empty</p>
                <button
                  onClick={() => onNavigate('shop')}
                  className='text-primary hover:underline font-medium'
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <div className='space-y-4'>
                {cart.map(item => (
                  <div key={item.id} className='bg-card border border-border rounded-lg p-6'>
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex items-center gap-4'>
                        <div className='text-4xl'>{item.image}</div>
                        <div>
                          <h3 className='font-bold text-lg'>{item.name}</h3>
                          <p className='text-sm text-muted-foreground'>{item.category}</p>
                        </div>
                      </div>
                      <p className='font-bold text-lg'>${item.price}</p>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3 bg-muted rounded-lg p-1'>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className='px-3 py-1 hover:bg-primary/20 rounded transition-colors'
                        >
                          −
                        </button>
                        <span className='px-3 font-semibold min-w-12 text-center'>{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className='px-3 py-1 hover:bg-primary/20 rounded transition-colors'
                        >
                          +
                        </button>
                      </div>

                      <div className='text-right'>
                        <p className='text-sm text-muted-foreground'>Subtotal</p>
                        <p className='font-bold text-lg'>${(item.price * item.quantity).toFixed(2)}</p>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className='text-destructive hover:bg-destructive/10 px-4 py-2 rounded-lg transition-colors'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <div className='bg-card border border-border rounded-lg p-6 sticky top-24 space-y-6'>
              <h2 className='font-bold text-xl'>Order Summary</h2>

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
                <button
                  onClick={() => onNavigate('checkout')}
                  className='w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
                >
                  Proceed to Checkout
                </button>
              )}

              <button
                onClick={() => onNavigate('shop')}
                className='w-full py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
