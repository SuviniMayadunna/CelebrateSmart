import React from "react"

import { useState } from 'react';
import { AppScreen, CartItem, EventData } from '@/app/page';

interface CheckoutScreenProps {
  cart: CartItem[];
  event: EventData | null;
  onNavigate: (screen: AppScreen) => void;
  onComplete: () => void;
}

export function CheckoutScreen({ cart, event, onNavigate, onComplete }: CheckoutScreenProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    onComplete();
  };

  return (
    <div className='min-h-screen bg-background'>
      <main className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Contact Information */}
              <div className='bg-card border border-border rounded-lg p-6'>
                <h2 className='font-bold text-xl mb-6'>Contact Information</h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold mb-2'>Full Name *</label>
                    <input
                      type='text'
                      name='fullName'
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                    />
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Email *</label>
                      <input
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Phone *</label>
                      <input
                        type='tel'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-semibold mb-2'>Delivery Address *</label>
                    <input
                      type='text'
                      name='address'
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className='bg-card border border-border rounded-lg p-6'>
                <h2 className='font-bold text-xl mb-6'>Payment Information</h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-semibold mb-2'>Card Number *</label>
                    <input
                      type='text'
                      name='cardNumber'
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder='1234 5678 9012 3456'
                      required
                      className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>Expiry Date *</label>
                      <input
                        type='text'
                        name='expiryDate'
                        value={formData.expiryDate}
                        onChange={handleChange}
                        placeholder='MM/YY'
                        required
                        className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-semibold mb-2'>CVV *</label>
                      <input
                        type='text'
                        name='cvv'
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder='123'
                        required
                        className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex gap-4'>
                <button
                  type='button'
                  onClick={() => onNavigate('cart')}
                  className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
                >
                  Back to Cart
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50'
                >
                  {loading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className='bg-card border border-border rounded-lg p-6 sticky top-24'>
              <h2 className='font-bold text-xl mb-6'>Order Summary</h2>

              {event && (
                <div className='pb-6 border-b border-border mb-6'>
                  <p className='text-sm text-muted-foreground mb-1'>Event</p>
                  <p className='font-semibold'>{event.name}</p>
                </div>
              )}

              <div className='space-y-3 max-h-64 overflow-y-auto mb-6 pb-6 border-b border-border'>
                {cart.map(item => (
                  <div key={item.id} className='flex justify-between text-sm'>
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
