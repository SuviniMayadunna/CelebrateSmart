import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { WelcomeScreen } from '@/components/welcome-screen';
import { LoginScreen } from '@/components/login-screen';
import { RegistrationScreen } from '@/components/registration-screen';
import { DashboardScreen } from '@/components/dashboard-screen';
import { MyEventsScreen } from '@/components/my-events-screen';
import { EventTemplateScreen } from '@/components/event-template-screen';
import { EventCreationScreen } from '@/components/event-creation-screen';
import { EventPlanningScreen } from '@/components/event-planning-screen';
import { EventPlanViewer } from '@/components/event-plan-viewer';
import { EventPlanScreen } from '@/components/event-plan-screen';
import { ShopScreen } from '@/components/shop-screen';
import { CartScreen } from '@/components/cart-screen';
import { CheckoutScreen } from '@/components/checkout-screen';
import { ConfirmationScreen } from '@/components/confirmation-screen';
import { MyOrdersScreen } from '@/components/my-orders-screen';
import { ProfileScreen } from '@/components/profile-screen';
import { PackagePickerScreen } from '@/components/package-picker-screen';
import { PackageCustomizerScreen } from '@/components/package-customizer-screen';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Navigation } from '@/components/navigation';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { eventsAPI, cartAPI } from '@/lib/api';
import type { Product as ApiProduct, Package, EventPlan } from '@/lib/api';

// ── URL ↔ screen mapping ──────────────────────────────────────────────────────

export type AppScreen =
  | 'welcome' | 'login' | 'register' | 'dashboard' | 'my-events'
  | 'event-templates' | 'event-creation' | 'event-planning' | 'event-plan-viewer' | 'event-plan'
  | 'shop' | 'cart' | 'checkout' | 'confirmation' | 'my-orders' | 'profile'
  | 'package-picker' | 'package-customizer' | 'admin-dashboard';

function screenToPath(screen: AppScreen, event?: { id: string } | null): string {
  switch (screen) {
    case 'welcome':            return '/';
    case 'login':              return '/login';
    case 'register':           return '/register';
    case 'dashboard':          return '/dashboard';
    case 'my-events':          return '/events';
    case 'event-templates':    return '/templates';
    case 'event-creation':     return '/events/new';
    case 'event-planning':     return event?.id ? `/events/${event.id}/planning` : '/events';
    case 'event-plan-viewer':  return event?.id ? `/events/${event.id}/viewer` : '/events';
    case 'event-plan':         return event?.id ? `/events/${event.id}/plan`   : '/events';
    case 'shop':               return '/shop';
    case 'cart':               return '/cart';
    case 'checkout':           return '/checkout';
    case 'confirmation':       return '/confirmation';
    case 'my-orders':          return '/orders';
    case 'profile':            return '/profile';
    case 'package-picker':     return '/packages';
    case 'package-customizer': return '/packages/customize';
    case 'admin-dashboard':    return '/admin';
    default:                   return '/dashboard';
  }
}

interface ParsedPath { screen: AppScreen; eventId?: string; adminTab?: string }

function pathToScreen(pathname: string): ParsedPath | null {
  if (pathname === '/')                return { screen: 'welcome' };
  if (pathname === '/login')           return { screen: 'login' };
  if (pathname === '/register')        return { screen: 'register' };
  if (pathname === '/dashboard')       return { screen: 'dashboard' };
  if (pathname === '/events')          return { screen: 'my-events' };
  if (pathname === '/events/new')      return { screen: 'event-creation' };
  if (pathname === '/templates')       return { screen: 'event-templates' };
  if (pathname === '/shop')            return { screen: 'shop' };
  if (pathname === '/cart')            return { screen: 'cart' };
  if (pathname === '/checkout')        return { screen: 'checkout' };
  if (pathname === '/orders')          return { screen: 'my-orders' };
  if (pathname === '/profile')         return { screen: 'profile' };
  if (pathname === '/packages')        return { screen: 'package-picker' };
  if (pathname === '/packages/customize') return { screen: 'package-customizer' };
  if (pathname === '/admin')           return { screen: 'admin-dashboard', adminTab: 'overview' };
  const adminMatch = pathname.match(/^\/admin\/([^/]+)$/);
  if (adminMatch)                      return { screen: 'admin-dashboard', adminTab: adminMatch[1] };
  if (pathname === '/confirmation')    return { screen: 'confirmation' };

  const planningMatch  = pathname.match(/^\/events\/([^/]+)\/planning$/);
  if (planningMatch) return { screen: 'event-planning',   eventId: planningMatch[1] };

  const viewerMatch    = pathname.match(/^\/events\/([^/]+)\/viewer$/);
  if (viewerMatch)  return { screen: 'event-plan-viewer', eventId: viewerMatch[1] };

  const planMatch      = pathname.match(/^\/events\/([^/]+)\/plan$/);
  if (planMatch)    return { screen: 'event-plan',        eventId: planMatch[1] };

  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EventData {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  venueBooked?: string;
  notes: string;
  status?: string;
  completedTasks: string[];
  packageId?:      string | null;
  guestCount?:     number | null;
  colorTheme?:     string | null;
  hasPaidOrder?:            boolean;
  paidOrderId?:             string | null;
  orderTotalAmount?:        number | null;
  orderOriginalGuestCount?: number | null;
  planStepsTotal?: number;
  planStepsDone?:  number;
}

export interface CartItem {
  id: string;
  quantity: number;
  eventId: string | null;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl: string | null;
    description: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  name: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const { user, isLoading: authLoading, login, register, logout: authLogout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [currentEvent,  setCurrentEvent]  = useState<EventData | null>(null);
  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [events,        setEvents]        = useState<EventData[]>([]);
  const [adminTab,      setAdminTab]      = useState<string>('overview');
  const [returnToPlanning, setReturnToPlanning] = useState(false);
  const [shopCategory,  setShopCategory]  = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [lastOrderId,   setLastOrderId]   = useState('');
  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [_currentPlan,   setCurrentPlan]   = useState<EventPlan | null>(null);

  const [loginLoading,    setLoginLoading]    = useState(false);
  const [loginError,      setLoginError]      = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError,   setRegisterError]   = useState<string | null>(null);

  // ── URL restoration after auth load ──────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;

    const parsed        = pathToScreen(location.pathname);
    const isGuestOnly   = ['/login', '/register'].includes(location.pathname);
    const isPublic      = ['/', '/login', '/register'].includes(location.pathname);

    if (!user) {
      if (!isPublic) {
        navigate('/login', { replace: true });
        setCurrentScreen('login');
      } else {
        setCurrentScreen(parsed?.screen ?? 'welcome');
      }
      return;
    }

    // Logged-in user on guest-only or root path → send to home
    if (isGuestOnly || location.pathname === '/') {
      const home = user.role === 'admin' ? '/admin' : '/dashboard';
      navigate(home, { replace: true });
      setCurrentScreen(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
      return;
    }

    if (!parsed) {
      navigate('/dashboard', { replace: true });
      setCurrentScreen('dashboard');
      return;
    }

    setCurrentScreen(parsed.screen);
    if (parsed.adminTab) setAdminTab(parsed.adminTab);

    // Restore package-customizer from sessionStorage
    if (parsed.screen === 'package-customizer' && !selectedPackage) {
      const stored = sessionStorage.getItem('_cs_package');
      if (stored) {
        try { setSelectedPackage(JSON.parse(stored)); } catch { /* ignore */ }
      } else {
        navigate('/packages', { replace: true });
        setCurrentScreen('package-picker');
      }
    }
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load events and cart; restore event from URL ──────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setCart([]);
      setEvents([]);
      setCurrentEvent(null);
      return;
    }

    eventsAPI.list()
      .then(res => {
        const loaded = res.data.events as EventData[];
        setEvents(loaded);

        // If refreshing on an event-specific route, restore currentEvent
        const parsed = pathToScreen(location.pathname);
        if (parsed?.eventId && !currentEvent) {
          const evt = loaded.find(e => e.id === parsed.eventId);
          if (evt) {
            setCurrentEvent(evt);
          } else {
            navigate('/events', { replace: true });
            setCurrentScreen('my-events');
          }
        }
      })
      .catch(() => {});

    cartAPI.get()
      .then(res => setCart(res.data.items))
      .catch(() => setCart([]));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync adminTab → URL ──────────────────────────────────────────────────────
  useEffect(() => {
    if (currentScreen === 'admin-dashboard') {
      const path = adminTab === 'overview' ? '/admin' : `/admin/${adminTab}`;
      navigate(path, { replace: true });
    }
  }, [adminTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ───────────────────────────────────────────────────────────────

  const handleNavigate = (screen: AppScreen, event?: EventData, eventType?: string) => {
    if (event) setCurrentEvent(event);
    if (eventType !== undefined) setSelectedEventType(eventType);
    setCurrentScreen(screen);
    navigate(screenToPath(screen, event ?? currentEvent));
    // Re-fetch events list when returning to My Events or Dashboard so plan step progress is current
    if ((screen === 'my-events' || screen === 'dashboard') && user?.id) {
      eventsAPI.list()
        .then(res => setEvents(res.data.events as EventData[]))
        .catch(() => {});
    }
  };

  // ── Auth ─────────────────────────────────────────────────────────────────────

  const handleLogin = async (email: string, password: string, role: 'customer' | 'admin') => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login(email, password, role);
      toast({ title: 'Signed in', description: 'Welcome back!' });
      handleNavigate(role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      toast({ variant: 'destructive', title: 'Login failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, password: string, phone: string) => {
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      await register(name, email, password, phone);
      toast({ title: 'Account created', description: 'You are now signed in.' });
      handleNavigate('dashboard');
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      toast({ variant: 'destructive', title: 'Registration failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    authLogout();
    setCurrentEvent(null);
    setCart([]);
    setEvents([]);
    setCurrentScreen('welcome');
    navigate('/');
  };

  // ── Events ───────────────────────────────────────────────────────────────────

  const handleCreateEvent = async (eventData: Omit<EventData, 'id' | 'completedTasks'>) => {
    try {
      const res = await eventsAPI.create({
        name: eventData.name, type: eventData.type, date: eventData.date,
        time: eventData.time, venue: eventData.venue, notes: eventData.notes,
      });
      const newEvent = res.data.event as EventData;
      setCurrentEvent(newEvent);
      setEvents(prev => [newEvent, ...prev]);
      handleNavigate('event-planning', newEvent);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to create event', description: err instanceof Error ? err.message : 'Please try again.' });
    }
  };

  const handleCompleteTask = async (taskId: string, venueDetails?: string) => {
    if (!currentEvent) return;
    try {
      const res = await eventsAPI.completeTask(currentEvent.id, taskId, venueDetails ? { venueBooked: venueDetails } : undefined);
      const updated = res.data.event as EventData;
      setCurrentEvent(updated);
      setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    } catch {
      const updated = {
        ...currentEvent,
        completedTasks: [...currentEvent.completedTasks, taskId],
        ...(venueDetails && taskId === 'venue' ? { venueBooked: venueDetails } : {}),
      };
      setCurrentEvent(updated);
      setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    }
  };

  // ── Cart ─────────────────────────────────────────────────────────────────────

  const PRODUCT_CATEGORY_TO_TASK: Record<string, string> = {
    CAKES: 'cake', DECORATIONS: 'decorations', FOOD: 'food',
    ENTERTAINMENT: 'entertainment', PHOTOGRAPHY: 'photography', VENUE: 'venue',
  };

  const handleAddToCart = async (product: ApiProduct, quantity = 1) => {
    const eventId = currentEvent?.id;
    try {
      await cartAPI.addItem(product.id, quantity, eventId);
      const res = await cartAPI.get();
      setCart(res.data.items);

      if (returnToPlanning && currentEvent) {
        const taskId = PRODUCT_CATEGORY_TO_TASK[product.category];
        if (taskId && !currentEvent.completedTasks.includes(taskId)) {
          const venueDetails = taskId === 'venue' ? (product.venueAddress ?? product.name) : undefined;
          await handleCompleteTask(taskId, venueDetails ?? undefined);
        }
        setReturnToPlanning(false);
        handleNavigate('event-planning');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to add to cart', description: err instanceof Error ? err.message : 'Please try again.' });
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
    try {
      await cartAPI.removeItem(itemId);
    } catch {
      cartAPI.get().then(res => setCart(res.data.items)).catch(() => {});
    }
  };

  const handleUpdateCartQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) { handleRemoveFromCart(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    try {
      await cartAPI.updateItem(itemId, quantity);
    } catch {
      cartAPI.get().then(res => setCart(res.data.items)).catch(() => {});
    }
  };

  const handleCheckoutComplete = (orderId: string) => {
    setLastOrderId(orderId);
    setLastOrderItems([...cart]);
    setCart([]);
    handleNavigate('confirmation');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'login':
        return <LoginScreen onLogin={handleLogin} onNavigate={handleNavigate} isLoading={loginLoading} error={loginError} />;
      case 'register':
        return <RegistrationScreen onRegister={handleRegister} onNavigate={handleNavigate} isLoading={registerLoading} error={registerError} />;
      case 'dashboard':
        return <DashboardScreen user={user} events={events} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'my-events':
        return <MyEventsScreen events={events} onNavigate={handleNavigate} />;
      case 'event-templates':
        return <EventTemplateScreen onNavigate={handleNavigate} />;
      case 'event-creation':
        return <EventCreationScreen onNavigate={handleNavigate} onCreate={handleCreateEvent} preselectedType={selectedEventType} />;
      case 'event-planning':
        return currentEvent && (
          <EventPlanningScreen
            event={currentEvent}
            onCompleteTask={handleCompleteTask}
            onNavigate={handleNavigate}
            onShop={() => { setReturnToPlanning(true); setShopCategory(null); handleNavigate('shop'); }}
            onShopWithCategory={(category: string) => { setReturnToPlanning(true); setShopCategory(category); handleNavigate('shop'); }}
          />
        );
      case 'event-plan-viewer':
        return currentEvent && <EventPlanViewer event={currentEvent} onNavigate={handleNavigate} />;
      case 'event-plan':
        return currentEvent ? (
          <EventPlanScreen
            event={currentEvent}
            initialPlan={null}
            onNavigate={handleNavigate}
            onEventUpdate={(updated) => {
              setCurrentEvent(updated);
              setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            }}
          />
        ) : null;
      case 'shop':
        return <ShopScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} event={currentEvent} returnToPlanning={returnToPlanning} initialCategory={shopCategory} cartItems={cart} />;
      case 'cart':
        return (
          <CartScreen
            cart={cart}
            event={currentEvent}
            onNavigate={handleNavigate}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateCartQuantity}
          />
        );
      case 'checkout':
        return (
          <CheckoutScreen cart={cart} event={currentEvent} onNavigate={handleNavigate} onComplete={() => handleCheckoutComplete('')} />
        );
      case 'my-orders':
        return <MyOrdersScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'package-picker':
        return (
          <PackagePickerScreen
            onNavigate={handleNavigate}
            onSelectPackage={(pkg) => {
              setSelectedPackage(pkg);
              sessionStorage.setItem('_cs_package', JSON.stringify(pkg));
              setCurrentScreen('package-customizer');
              navigate('/packages/customize');
            }}
          />
        );
      case 'package-customizer':
        return selectedPackage ? (
          <PackageCustomizerScreen
            pkg={selectedPackage}
            onNavigate={handleNavigate}
            onBooked={(event, plan) => {
              setCurrentEvent(event);
              setCurrentPlan(plan);
              setEvents(prev => [event, ...prev.filter(e => e.id !== event.id)]);
              sessionStorage.removeItem('_cs_package');
              navigate(`/events/${event.id}/plan`);
              setCurrentScreen('event-plan');
            }}
          />
        ) : null;
      case 'confirmation':
        return <ConfirmationScreen onNavigate={handleNavigate} cart={lastOrderItems} event={currentEvent} orderId={lastOrderId} />;
      case 'admin-dashboard':
        return <AdminDashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} adminTab={adminTab} onAdminTabChange={setAdminTab} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center space-y-3'>
          <div className='inline-flex items-center justify-center gap-2'>
            <Spinner className='size-5' />
            <span className='font-medium'>Loading CelebrateSmart…</span>
          </div>
          <p className='text-sm text-muted-foreground'>Restoring your session</p>
        </div>
      </div>
    );
  }

  const showNavigation = !['welcome', 'login', 'register'].includes(currentScreen);

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {showNavigation && (
        <Navigation
          currentScreen={currentScreen}
          user={user}
          cart={cart}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          adminTab={adminTab}
          onAdminTabChange={setAdminTab}
        />
      )}
      <main className={`${showNavigation ? 'md:ml-64' : ''} ${showNavigation ? 'pt-16 md:pt-0' : ''}`}>
        {renderScreen()}
      </main>
    </div>
  );
}
