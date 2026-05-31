import { ShoppingCart, User, Home, Calendar, Store, LogOut, Menu, X, BarChart3, Package, ShoppingCart as Orders, LayoutTemplate, Bell, Receipt, CalendarPlus, Boxes, Users, Wrench } from 'lucide-react';
import { AppScreen, CartItem, User as UserType } from '@/App';
import { useEffect, useState } from 'react';
import { notificationsAPI } from '@/lib/api';
import type { AppNotification } from '@/lib/api';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Poll unread count for customers every 30s
  useEffect(() => {
    if (!isCustomer) return;
    const fetchCount = async () => {
      try {
        const res = await notificationsAPI.unreadCount();
        setUnreadCount(res.data.count);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close notification panel on Escape
  useEffect(() => {
    if (!notifOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setNotifOpen(false); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [notifOpen]);

  const openNotifPanel = async () => {
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {} finally {
      setNotifLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (currentScreen === 'welcome' || currentScreen === 'login' || currentScreen === 'register') return null;

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Screens that belong under each customer nav item (for active highlight)
  const EVENT_SCREENS: AppScreen[] = ['my-events', 'event-workspace'];
  const PLAN_SCREENS:  AppScreen[] = ['package-picker', 'package-customizer'];

  const navItems = user?.role === 'admin'
    ? [
        { icon: BarChart3,      label: 'Overview',      tab: 'overview',       screen: null },
        { icon: Wrench,         label: 'Operations',    tab: 'operations',     screen: null },
        { icon: Users,          label: 'Customers',     tab: 'customers',      screen: null },
        { icon: Package,        label: 'Products',      tab: 'products',       screen: null },
        { icon: Boxes,          label: 'Packages',      tab: 'packages',       screen: null },
        { icon: Orders,         label: 'Orders',        tab: 'orders',         screen: null },
        { icon: LayoutTemplate, label: 'Templates',     tab: 'templates',      screen: null },
        { icon: Bell,           label: 'Notifications', tab: 'notifications',  screen: null },
      ]
    : [
        { icon: Home,         label: 'Dashboard', screen: 'dashboard'      as AppScreen, tab: null },
        { icon: CalendarPlus, label: 'Plan Event', screen: 'package-picker' as AppScreen, tab: null },
        { icon: Calendar,     label: 'My Events',  screen: 'my-events'      as AppScreen, tab: null },
        { icon: Store,        label: 'Shop',        screen: 'shop'           as AppScreen, tab: null },
        { icon: Receipt,      label: 'Orders',      screen: 'my-orders'      as AppScreen, tab: null },
      ];

  const isItemActive = (screen: AppScreen | null): boolean => {
    if (!screen) return false;
    if (currentScreen === screen) return true;
    if (screen === 'my-events'      && EVENT_SCREENS.includes(currentScreen)) return true;
    if (screen === 'package-picker' && PLAN_SCREENS.includes(currentScreen))  return true;
    return false;
  };

  const sidebarBg = 'linear-gradient(180deg, hsl(155,45%,10%) 0%, hsl(155,42%,14%) 50%, hsl(155,40%,18%) 100%)';

  const notifBadge = (count: number, small?: boolean) =>
    count > 0 ? (
      <span
        className={`${small ? 'absolute -top-0.5 -right-0.5 w-4 h-4' : 'ml-auto w-5 h-5'} text-xs font-bold rounded-full flex items-center justify-center`}
        style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}
      >
        {count > 99 ? '99+' : count > 9 && small ? '9+' : count}
      </span>
    ) : null;

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className='hidden md:flex fixed left-0 top-0 h-screen w-64 z-50 flex-col overflow-y-auto'
        style={{ background: sidebarBg }}
      >
        {/* Gold top accent */}
        <div className='h-1 shrink-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

        {/* Brand */}
        <div
          className='px-6 py-5 cursor-pointer shrink-0 border-b transition-colors hover:bg-white/5'
          style={{ borderColor: 'hsl(155,38%,18%)' }}
          onClick={() => onNavigate(user?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
        >
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl flex items-center justify-center shrink-0'
              style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))' }}>
            </div>
            <div>
              <p className='font-serif text-lg font-bold text-white leading-tight'>CelebrateSmart</p>
              <p className='text-xs' style={{ color: 'hsl(43,60%,65%)', fontFamily: 'Inter, sans-serif' }}>
                {user?.role === 'admin' ? 'Admin Panel' : 'Plan & Shop'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className='flex-1 px-3 py-5 space-y-1'>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = user?.role === 'admin' ? adminTab === item.tab : isItemActive(item.screen);
            return (
              <button
                key={item.tab ?? item.screen}
                onClick={() => {
                  if (user?.role === 'admin' && item.tab && onAdminTabChange) onAdminTabChange(item.tab);
                  else if (item.screen) onNavigate(item.screen);
                }}
                className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold'
                style={{
                  background: isActive ? 'rgba(255,255,255,0.95)' : 'transparent',
                  color: isActive ? 'hsl(155,42%,17%)' : 'rgba(255,255,255,0.75)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Icon className='w-4 h-4 shrink-0' />
                {item.label}
              </button>
            );
          })}

          {/* Notifications bell — customers only */}
          {isCustomer && (
            <button
              onClick={openNotifPanel}
              className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold'
              style={{
                background: notifOpen ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: notifOpen ? 'hsl(155,42%,17%)' : 'rgba(255,255,255,0.75)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Bell className='w-4 h-4 shrink-0' />
              Notifications
              {notifBadge(unreadCount)}
            </button>
          )}

          {/* Cart button — customers only */}
          {isCustomer && (
            <button
              onClick={() => onNavigate('cart')}
              className='w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold relative'
              style={{
                background: currentScreen === 'cart' ? 'rgba(255,255,255,0.95)' : 'transparent',
                color: currentScreen === 'cart' ? 'hsl(155,42%,17%)' : 'rgba(255,255,255,0.75)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <ShoppingCart className='w-4 h-4 shrink-0' />
              Cart
              {cartItemCount > 0 && (
                <span className='ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'
                  style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}>
                  {cartItemCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User section */}
        <div className='p-3 border-t shrink-0 space-y-2' style={{ borderColor: 'hsl(155,38%,18%)' }}>
          <button
            onClick={() => isCustomer && onNavigate('profile')}
            className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors'
            style={{ background: 'hsl(155,42%,15%)', cursor: isCustomer ? 'pointer' : 'default' }}
          >
            <div className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
              style={{ background: 'linear-gradient(135deg, hsl(155,38%,27%), hsl(155,22%,38%))' }}>
              <User className='w-4 h-4 text-white' />
            </div>
            <div className='flex-1 min-w-0 text-left'>
              <p className='text-sm font-semibold text-white truncate' style={{ fontFamily: 'Inter, sans-serif' }}>{user?.name}</p>
              <p className='text-xs capitalize' style={{ color: 'hsl(43,60%,65%)', fontFamily: 'Inter, sans-serif' }}>
                {isCustomer ? 'View Profile' : user?.role}
              </p>
            </div>
          </button>
          <button
            onClick={onLogout}
            className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10'
            style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}
          >
            <LogOut className='w-4 h-4' />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <div
        className='md:hidden fixed top-0 left-0 right-0 z-50'
        style={{ background: 'linear-gradient(90deg, hsl(155,45%,10%), hsl(155,38%,16%))' }}
      >
        <div className='h-0.5' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />
        <div className='flex items-center justify-between px-4 h-14'>
          <button
            className='flex items-center gap-2 cursor-pointer'
            onClick={() => onNavigate(user?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          >
            <span className='font-serif text-base font-bold text-white'>CelebrateSmart</span>
          </button>

          <div className='flex items-center gap-1'>
            {/* Notification bell — mobile, customers only */}
            {isCustomer && (
              <button
                onClick={openNotifPanel}
                aria-label='Open notifications'
                className='relative p-2 rounded-lg transition-colors hover:bg-white/10'
              >
                <Bell className='w-5 h-5 text-white' />
                {notifBadge(unreadCount, true)}
              </button>
            )}
            {isCustomer && (
              <button
                onClick={() => onNavigate('cart')}
                aria-label='Open cart'
                className='relative p-2 rounded-lg transition-colors hover:bg-white/10'
              >
                <ShoppingCart className='w-5 h-5 text-white' />
                {cartItemCount > 0 && (
                  <span className='absolute -top-0.5 -right-0.5 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center'
                    style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}>
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className='p-2 rounded-lg transition-colors hover:bg-white/10'
            >
              {mobileMenuOpen ? <X className='w-5 h-5 text-white' /> : <Menu className='w-5 h-5 text-white' />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {mobileMenuOpen && (
        <>
          <button
            type='button'
            aria-label='Close menu overlay'
            onClick={() => setMobileMenuOpen(false)}
            className='md:hidden fixed inset-0 top-[3.25rem] bg-black/40 z-40'
          />
          <div
            className='md:hidden fixed top-[3.25rem] left-0 right-0 z-50 border-t'
            style={{ background: 'hsl(155,45%,10%)', borderColor: 'hsl(155,38%,18%)' }}
          >
            <div className='px-3 py-3 space-y-1'>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = user?.role === 'admin' ? adminTab === item.tab : isItemActive(item.screen);
                return (
                  <button
                    key={item.tab ?? item.screen}
                    onClick={() => {
                      if (user?.role === 'admin' && item.tab && onAdminTabChange) onAdminTabChange(item.tab);
                      else if (item.screen) onNavigate(item.screen);
                      setMobileMenuOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all'
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.9)' : 'transparent',
                      color: isActive ? 'hsl(155,42%,17%)' : 'rgba(255,255,255,0.75)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <Icon className='w-4 h-4' />
                    {item.label}
                  </button>
                );
              })}

              {/* Notifications — mobile menu, customers only */}
              {isCustomer && (
                <button
                  onClick={() => { openNotifPanel(); setMobileMenuOpen(false); }}
                  className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all'
                  style={{
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.75)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <Bell className='w-4 h-4' />
                  Notifications
                  {unreadCount > 0 && (
                    <span className='ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'
                      style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {isCustomer && (
                <button
                  onClick={() => { onNavigate('cart'); setMobileMenuOpen(false); }}
                  className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all'
                  style={{
                    background: currentScreen === 'cart' ? 'rgba(255,255,255,0.9)' : 'transparent',
                    color: currentScreen === 'cart' ? 'hsl(155,42%,17%)' : 'rgba(255,255,255,0.75)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <ShoppingCart className='w-4 h-4' />
                  Cart
                  {cartItemCount > 0 && (
                    <span className='ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'
                      style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}>
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              <div className='border-t pt-2 mt-1 space-y-1' style={{ borderColor: 'hsl(155,38%,18%)' }}>
                <div className='flex items-center gap-3 px-4 py-2'>
                  <User className='w-4 h-4' style={{ color: 'hsl(43,60%,65%)' }} />
                  <span className='text-sm font-semibold text-white' style={{ fontFamily: 'Inter, sans-serif' }}>{user?.name}</span>
                </div>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10'
                  style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}
                >
                  <LogOut className='w-4 h-4' />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Notification Panel (customers only) ── */}
      {notifOpen && isCustomer && (
        <>
          {/* Backdrop */}
          <button
            type='button'
            aria-label='Close notifications'
            onClick={() => setNotifOpen(false)}
            className='fixed inset-0 z-[55] bg-black/50'
          />
          {/* Slide-in panel */}
          <div
            className='fixed top-0 right-0 h-screen w-80 z-[60] flex flex-col shadow-2xl'
            style={{ background: 'linear-gradient(180deg, hsl(155,45%,10%) 0%, hsl(155,42%,13%) 100%)', borderLeft: '1px solid hsl(155,38%,20%)' }}
          >
            {/* Gold accent */}
            <div className='h-1 shrink-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />

            {/* Header */}
            <div className='flex items-center justify-between px-5 py-4 border-b shrink-0' style={{ borderColor: 'hsl(155,38%,18%)' }}>
              <div className='flex items-center gap-2'>
                <Bell className='w-4 h-4' style={{ color: 'hsl(43,60%,65%)' }} />
                <h2 className='text-sm font-bold text-white' style={{ fontFamily: 'Inter, sans-serif' }}>Notifications</h2>
                {unreadCount > 0 && (
                  <span className='text-xs font-bold rounded-full px-1.5 py-0.5' style={{ background: 'hsl(43,74%,49%)', color: 'hsl(155,45%,10%)' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className='flex items-center gap-3'>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className='text-xs transition-colors hover:text-white'
                    style={{ color: 'hsl(43,60%,65%)', fontFamily: 'Inter, sans-serif' }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className='p-1 rounded-lg transition-colors hover:bg-white/10'
                  aria-label='Close notifications'
                >
                  <X className='w-4 h-4 text-white' />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto'>
              {notifLoading ? (
                <div className='flex items-center justify-center py-16'>
                  <div
                    className='w-6 h-6 rounded-full border-2 animate-spin'
                    style={{ borderColor: 'hsl(43,74%,49%)', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : notifications.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-20 gap-4'>
                  <div className='w-14 h-14 rounded-full flex items-center justify-center' style={{ background: 'hsl(155,38%,16%)' }}>
                    <Bell className='w-6 h-6' style={{ color: 'hsl(155,38%,35%)' }} />
                  </div>
                  <div className='text-center'>
                    <p className='text-sm font-semibold text-white' style={{ fontFamily: 'Inter, sans-serif' }}>No notifications</p>
                    <p className='text-xs mt-1' style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>You're all caught up!</p>
                  </div>
                </div>
              ) : (
                <div>
                  {notifications.map((notif, idx) => (
                    <div
                      key={notif.id}
                      className='px-5 py-4 transition-colors'
                      style={{
                        background: notif.isRead ? 'transparent' : 'rgba(255,255,255,0.035)',
                        borderBottom: idx < notifications.length - 1 ? '1px solid hsl(155,38%,17%)' : 'none',
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='mt-1.5 shrink-0'>
                          {notif.isRead
                            ? <div className='w-2 h-2' />
                            : <div className='w-2 h-2 rounded-full' style={{ background: 'hsl(43,74%,49%)' }} />
                          }
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className={`text-sm leading-snug ${notif.isRead ? '' : 'font-semibold'} text-white`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {notif.title}
                          </p>
                          <p className='text-xs mt-1 leading-relaxed' style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
                            {notif.content.replace(/\s*\[(?:event-reminder|sched):[^\]]+\]/g, '').trim()}
                          </p>
                          <p className='text-xs mt-2' style={{ color: 'hsl(43,55%,58%)', fontFamily: 'Inter, sans-serif' }}>
                            {new Date(notif.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className='px-5 py-3 border-t shrink-0 text-center' style={{ borderColor: 'hsl(155,38%,18%)' }}>
                <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
                  Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
