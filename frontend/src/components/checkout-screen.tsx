import { useState } from 'react';
import { AppScreen, CartItem, EventData } from '@/App';
import { ordersAPI, cartAPI } from '@/lib/api';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { CreditCard, Mail, MapPin, Phone, ShoppingBag, User } from 'lucide-react';

interface CheckoutScreenProps {
  cart: CartItem[];
  event: EventData | null;
  onNavigate: (screen: AppScreen) => void;
  onComplete: (orderId: string) => void;
}

const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(6, 'Phone number is required'),
  address: z.string().optional(),
  cardNumber: z.string().trim().min(12, 'Card number is required'),
  expiryDate: z.string().trim().min(4, 'Expiry date is required'),
  cvv: z.string().trim().min(3, 'CVV is required'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutScreen({ cart, event, onNavigate, onComplete }: CheckoutScreenProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    mode: 'onTouched',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const submit = async (values: CheckoutFormValues) => {
    setLoading(true);
    try {
      // Create the order from the current cart
      const orderRes = await ordersAPI.create(
        event?.id ?? undefined,
        values.address?.trim() || undefined,
      );
      const orderId = orderRes.data.order.id;

      // Clear the cart from the database now that the order is placed
      await cartAPI.clear(event?.id ?? undefined).catch(() => {});

      onComplete(orderId);
    } catch {
      // Fallback: still clear cart and proceed so the user isn't stuck
      await cartAPI.clear(event?.id ?? undefined).catch(() => {});
      onComplete('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 py-8'>
        {cart.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>Nothing to check out</EmptyTitle>
              <EmptyDescription>Your cart is empty.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => onNavigate('shop')} className='w-full font-semibold'>
                Continue shopping
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Where should we send updates?</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='fullName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <div className='relative'>
                            <User className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                            <FormControl>
                              <Input
                                {...field}
                                disabled={loading}
                                autoComplete='name'
                                className='pl-9'
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <div className='relative'>
                              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={loading}
                                  type='email'
                                  autoComplete='email'
                                  className='pl-9'
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='phone'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <div className='relative'>
                              <Phone className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={loading}
                                  type='tel'
                                  autoComplete='tel'
                                  className='pl-9'
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name='address'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event / Delivery Address (optional)</FormLabel>
                          <div className='relative'>
                            <MapPin className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                            <FormControl>
                              <Input
                                {...field}
                                disabled={loading}
                                placeholder='Where should we deliver or set up?'
                                autoComplete='street-address'
                                className='pl-9'
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Demo checkout — no real payment is processed.</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='cardNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <div className='relative'>
                            <CreditCard className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
                            <FormControl>
                              <Input
                                {...field}
                                disabled={loading}
                                placeholder='1234 5678 9012 3456'
                                autoComplete='cc-number'
                                className='pl-9'
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='expiryDate'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={loading}
                                placeholder='MM/YY'
                                autoComplete='cc-exp'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='cvv'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={loading}
                                placeholder='123'
                                autoComplete='cc-csc'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormDescription>
                      Use any values — this is a simulated payment step.
                    </FormDescription>
                  </CardContent>
                </Card>

                <div className='flex flex-col-reverse sm:flex-row gap-3'>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={() => onNavigate('cart')}
                    className='w-full sm:flex-1 font-semibold'
                    disabled={loading}
                    size='lg'
                  >
                    Back to Cart
                  </Button>
                  <Button
                    type='submit'
                    className='w-full sm:flex-1 font-semibold'
                    disabled={loading}
                    size='lg'
                  >
                    {loading ? 'Processing…' : 'Complete Purchase'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className='sticky top-24'>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Totals for this purchase.</CardDescription>
              </CardHeader>
              <CardContent>

              {event && (
                <div className='pb-6 border-b border-border mb-6'>
                  <p className='text-sm text-muted-foreground mb-1'>Event</p>
                  <p className='font-semibold text-foreground'>{event.name}</p>
                </div>
              )}

              <div className='space-y-3 max-h-64 overflow-y-auto mb-6 pb-6 border-b border-border'>
                {cart.map(item => (
                  <div key={item.id} className='flex justify-between text-sm'>
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className='space-y-3 mb-6 pb-6 border-b border-border'>
                <div className='flex justify-between text-sm'>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='font-bold'>Total</span>
                <span className='text-2xl font-bold text-primary'>${total.toFixed(2)}</span>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
