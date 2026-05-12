import { ShoppingCart, User, Home, Calendar, Store, LogOut, Menu, X, Sparkles, BarChart3, Package, ShoppingCart as Orders, LayoutTemplate, Bell } from 'lucide-react';
import { AppScreen, CartItem, User as UserType } from '@/App';
import { useState } from 'react';

interface NavigationProps {
  currentScreen: AppScreen;
  user: UserType | null;
  cart: CartItem[];
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
  adminTab?: string;
  onAdminTabChange?: (tab: string) => void;
}

export function Navigation({ currentScreen, user, cart, onNavigate, onLogout, adminTab, onAdminTabChange }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (currentScreen === 'welcome' || currentScreen === 'login') {
    return null;
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = user?.role === 'admin' 
    ? [
        { icon: BarChart3, label: 'Overview', tab: 'overview', screen: null },
        { icon: Package, label: 'Products', tab: 'products', screen: null },
        { icon: Orders, label: 'Orders', tab: 'orders', screen: null },
        { icon: LayoutTemplate, label: 'Templates', tab: 'templates', screen: null },
        { icon: Bell, label: 'Notifications', tab: 'notifications', screen: null },
      ]
    : [
        { icon: Home, label: 'Dashboard', screen: 'dashboard' as AppScreen, tab: null },
        { icon: Calendar, label: 'Events', screen: 'my-events' as AppScreen, tab: null },
        { icon: Store, label: 'Shop', screen: 'shop' as AppScreen, tab: null },
      ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-primary via-secondary to-accent text-white shadow-2xl z-50 flex-col overflow-y-auto'>
        {/* Logo Section */}
        <div 
          className='p-6 border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors shrink-0'
          onClick={() => onNavigate(user?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
        >
          <div className='flex items-center space-x-3'>
            <div className='min-w-0 flex-1'>
              <h1 className='text-xl font-black leading-tight break-words'>CelebrateSmart</h1>
              <p className='text-xs text-white/80 flex items-center gap-1 mt-1'>
                <Sparkles className='w-3 h-3 shrink-0' />
                <span>Plan & Shop</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className='flex-1 px-4 py-6 space-y-2'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = user?.role === 'admin' 
              ? adminTab === item.tab
              : currentScreen === item.screen;
            return (
              <button
                key={item.tab || item.screen}
                onClick={() => {
                  if (user?.role === 'admin' && item.tab && onAdminTabChange) {
                    onAdminTabChange(item.tab);
                  } else if (item.screen) {
                    onNavigate(item.screen);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-white text-primary shadow-lg font-bold' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <Icon className='w-5 h-5' />
                <span className='text-base'>{item.label}</span>
              </button>
            );
          })}

          {/* Cart Button for Customers */}
          {user?.role !== 'admin' && (
            <button
              onClick={() => onNavigate('cart')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                currentScreen === 'cart'
                  ? 'bg-white text-primary shadow-lg font-bold' 
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              <ShoppingCart className='w-5 h-5' />
              <span className='text-base'>Cart</span>
              {cartItemCount > 0 && (
                <span className='absolute right-4 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center'>
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User Section */}
        <div className='p-4 border-t border-white/20 space-y-3'>
          <div className='flex items-center space-x-3 px-4 py-3 bg-white/10 rounded-xl'>
            <div className='w-10 h-10 bg-white/20 rounded-full flex items-center justify-center'>
              <User className='w-5 h-5' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-bold truncate'>{user?.name}</p>
              <p className='text-xs text-white/70 capitalize'>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className='w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium'
          >
            <LogOut className='w-5 h-5' />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className='md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg z-50'>
        <div className='flex items-center justify-between px-4 h-16'>
          <div 
            className='flex items-center space-x-2 cursor-pointer'
            onClick={() => onNavigate(user?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          >
            <div className='text-2xl'>🎉</div>
            <h1 className='text-lg font-bold'>CelebrateSmart</h1>
          </div>

          <div className='flex items-center space-x-2'>
            {user?.role !== 'admin' && (
              <button
                onClick={() => onNavigate('cart')}
                className='relative p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <ShoppingCart className='w-6 h-6' />
                {cartItemCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='p-2 hover:bg-white/10 rounded-lg transition-colors'
            >
              {mobileMenuOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className='bg-white/10 backdrop-blur-lg border-t border-white/20'>
            <div className='px-4 py-4 space-y-2'>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = user?.role === 'admin' 
                  ? adminTab === item.tab
                  : currentScreen === item.screen;
                return (
                  <button
                    key={item.tab || item.screen}
                    onClick={() => {
                      if (user?.role === 'admin' && item.tab && onAdminTabChange) {
                        onAdminTabChange(item.tab);
                      } else if (item.screen) {
                        onNavigate(item.screen);
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white/20 font-semibold' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className='w-5 h-5' />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className='border-t border-white/20 pt-2 mt-2'>
                <div className='flex items-center space-x-3 px-4 py-2 text-sm'>
                  <User className='w-4 h-4' />
                  <span>{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className='w-full flex items-center space-x-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors'
                >
                  <LogOut className='w-5 h-5' />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
