import { useState } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';
import { LoginScreen } from '@/components/login-screen';
import { RegistrationScreen } from '@/components/registration-screen';
import { DashboardScreen } from '@/components/dashboard-screen';
import { MyEventsScreen } from '@/components/my-events-screen';
import { EventTemplateScreen } from '@/components/event-template-screen';
import { EventCreationScreen } from '@/components/event-creation-screen';
import { EventPlanningScreen } from '@/components/event-planning-screen';
import { EventPlanViewer } from '@/components/event-plan-viewer';
import { ShopScreen } from '@/components/shop-screen';
import { CartScreen } from '@/components/cart-screen';
import { CheckoutScreen } from '@/components/checkout-screen';
import { ConfirmationScreen } from '@/components/confirmation-screen';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Navigation } from '@/components/navigation';

export type AppScreen = 
  | 'welcome'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'my-events'
  | 'event-templates'
  | 'event-creation'
  | 'event-planning'
  | 'event-plan-viewer'
  | 'shop'
  | 'cart'
  | 'checkout'
  | 'confirmation'
  | 'admin-dashboard';

export interface EventData {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  venueBooked?: string; // Tracks which venue option was selected
  notes: string;
  completedTasks: string[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image: string;
}

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'admin';
  name: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [adminTab, setAdminTab] = useState<string>('overview');
  const [returnToPlanning, setReturnToPlanning] = useState(false);
  const [shopCategory, setShopCategory] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

  const handleNavigate = (screen: AppScreen, event?: EventData, eventType?: string) => {
    if (event) {
      setCurrentEvent(event);
    }
    if (eventType !== undefined) {
      setSelectedEventType(eventType);
    }
    setCurrentScreen(screen);
  };

  const handleLogin = (email: string, _password: string, role: 'customer' | 'admin') => {
    const newUser: User = {
      id: Math.random().toString(36),
      email,
      role,
      name: email.split('@')[0],
    };
    setUser(newUser);
    handleNavigate(role === 'admin' ? 'admin-dashboard' : 'dashboard');
  };

  const handleRegister = (name: string, email: string, _password: string, _phone: string) => {
    const newUser: User = {
      id: Math.random().toString(36),
      email,
      role: 'customer',
      name,
    };
    setUser(newUser);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentEvent(null);
    setCart([]);
    handleNavigate('welcome');
  };

  const handleCreateEvent = (eventData: Omit<EventData, 'id' | 'completedTasks'>) => {
    const newEvent: EventData = {
      ...eventData,
      id: Math.random().toString(36),
      completedTasks: [],
    };
    setCurrentEvent(newEvent);
    setEvents([...events, newEvent]);
    handleNavigate('event-planning');
  };

  const handleCompleteTask = (taskId: string, venueDetails?: string) => {
    if (currentEvent) {
      const updated = {
        ...currentEvent,
        completedTasks: [...currentEvent.completedTasks, taskId],
        ...(venueDetails && taskId === 'venue' ? { venueBooked: venueDetails } : {}),
      };
      setCurrentEvent(updated);
      setEvents(events.map(e => (e.id === updated.id ? updated : e)));
    }
  };

  const handleAddToCart = (item: CartItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => (c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c)));
    } else {
      setCart([...cart, item]);
    }

    // If shopping from event planning, mark the relevant task as complete and return to planning
    if (returnToPlanning && currentEvent) {
      const categoryToTask: Record<string, string> = {
        'Cakes': 'cake',
        'Decorations': 'decorations',
        'Food': 'food',
        'Entertainment': 'entertainment',
        'Photography': 'photography',
        'Venue': 'venue',
      };
      
      const taskId = categoryToTask[item.category];
      if (taskId && !currentEvent.completedTasks.includes(taskId)) {
        // For venue items, store the venue name with address in venueBooked
        if (taskId === 'venue') {
          // Find the full venue details from shop products
          const venueDetails = item.category === 'Venue' && (item as any).venueAddress 
            ? (item as any).venueAddress 
            : item.name;
          
          const updatedEvent = {
            ...currentEvent,
            completedTasks: [...currentEvent.completedTasks, taskId],
            venueBooked: venueDetails,
          };
          setCurrentEvent(updatedEvent);
          setEvents(events.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
        } else {
          handleCompleteTask(taskId);
        }
      }
      
      setReturnToPlanning(false);
      handleNavigate('event-planning');
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      setCart(cart.map(item => (item.id === itemId ? { ...item, quantity } : item)));
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={handleNavigate} />;
      case 'login':
        return <LoginScreen onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'register':
        return <RegistrationScreen onRegister={handleRegister} onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardScreen user={user} events={events} onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'my-events':
        return <MyEventsScreen events={events} onNavigate={handleNavigate} />;
      case 'event-templates':
        return <EventTemplateScreen onNavigate={handleNavigate} />;
      case 'event-creation':
        return <EventCreationScreen onNavigate={handleNavigate} onCreate={handleCreateEvent} preselectedType={selectedEventType} />;
      case 'event-planning':
        return (
          currentEvent && (
            <EventPlanningScreen
              event={currentEvent}
              onCompleteTask={handleCompleteTask}
              onNavigate={handleNavigate}
              onShop={() => {
                setReturnToPlanning(true);
                setShopCategory(null);
                handleNavigate('shop');
              }}
              onShopWithCategory={(category: string) => {
                setReturnToPlanning(true);
                setShopCategory(category);
                handleNavigate('shop');
              }}
            />
          )
        );
      case 'event-plan-viewer':
        return currentEvent && <EventPlanViewer event={currentEvent} onNavigate={handleNavigate} />;
      case 'shop':
        return <ShopScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} event={currentEvent} returnToPlanning={returnToPlanning} initialCategory={shopCategory} />;
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
          <CheckoutScreen
            cart={cart}
            event={currentEvent}
            onNavigate={handleNavigate}
            onComplete={() => handleNavigate('confirmation')}
          />
        );
      case 'confirmation':
        return <ConfirmationScreen onNavigate={handleNavigate} cart={cart} event={currentEvent} />;
      case 'admin-dashboard':
        return <AdminDashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} adminTab={adminTab} onAdminTabChange={setAdminTab} />;
      default:
        return <WelcomeScreen onNavigate={handleNavigate} />;
    }
  };

  const showNavigation = currentScreen !== 'welcome' && currentScreen !== 'login' && currentScreen !== 'register';

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50'>
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
      {/* Main content with sidebar offset */}
      <main className={`${showNavigation ? 'md:ml-64' : ''} ${showNavigation ? 'pt-16 md:pt-0' : ''}`}>
        {renderScreen()}
      </main>
    </div>
  );
}
