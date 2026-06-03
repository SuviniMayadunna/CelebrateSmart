import { AppScreen, User } from '@/App';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { adminAPI, adminOperationsAPI, type AdminOperationEvent, type AdminOperationOrderItem, type AdminOrder, type AdminOrderDetail, type AdminProduct, type AdminTemplate, type AdminPackage, type AdminCustomer, type NotificationBroadcast, type PackageTier, type OrderStatus, type ProductCategory, type CreateProductRequest, type UpdateProductRequest, type CreateTemplateRequest, type UpdateTemplateRequest, type TemplateStepInput, type PackagePhoto } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { BarChart3, Bell, Boxes, LayoutTemplate, Package, RefreshCw, ShoppingCart, TrendingUp, Users, X, Plus, ChevronDown, ChevronRight, Pencil, Eye, Search, Mail, Phone, Calendar, Upload, Wrench, CheckCircle2, Circle, Building2, MapPin } from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (screen: AppScreen) => void;
  adminTab: string;
  onAdminTabChange: (tab: string) => void;
}

const labelStyle = { color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' };
const inputClass = 'h-11 rounded-xl border-2 focus:border-green-700 transition-colors';
const inputStyle = { borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' };

export function AdminDashboard({ adminTab }: AdminDashboardProps) {
  const [stats, setStats] = useState<{
    totalCustomers: number; totalOrders: number; totalRevenue: number; pendingOrders: number;
  } | null>(null);
  const [orders,    setOrders]    = useState<AdminOrder[]    | null>(null);
  const [products,  setProducts]  = useState<AdminProduct[]  | null>(null);
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);
  const [packages,   setPackages]   = useState<AdminPackage[]  | null>(null);
  const [customers,  setCustomers]  = useState<AdminCustomer[] | null>(null);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState({ stats: false, orders: false, products: false, templates: false, packages: false, customers: false, notification: false, broadcasts: false, productSave: false, templateSave: false, pkgSave: false, orderDetail: false });
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[] | null>(null);
  const [operations, setOperations] = useState<AdminOperationEvent[] | null>(null);
  const [expandedOrderItems, setExpandedOrderItems] = useState<Set<string>>(new Set());

  // Search state per tab
  const [productSearch,  setProductSearch]  = useState('');
  const [orderSearch,    setOrderSearch]    = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [packageSearch,  setPackageSearch]  = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  type PkgEditModal = { open: false } | { open: true; pkg: AdminPackage };
  type PkgFormItem = { productId: string; name: string; category: string; price: number; quantity: number; isCore: boolean };
  const [pkgEditModal, setPkgEditModal] = useState<PkgEditModal>({ open: false });
  const EMPTY_PKG_FORM = { name: '', description: '', highlights: '', items: [] as PkgFormItem[] };
  const [pkgForm, setPkgForm] = useState<typeof EMPTY_PKG_FORM>(EMPTY_PKG_FORM);
  const [pkgAddProductId, setPkgAddProductId] = useState('');

  type OrderDetailModal = { open: false } | { open: true; order: AdminOrderDetail | null; loading: boolean };
  const [orderDetailModal, setOrderDetailModal] = useState<OrderDetailModal>({ open: false });
  const [notificationForm, setNotificationForm] = useState({ recipientType: 'All Customers', title: '', content: '' });
  const [loadError, setLoadError] = useState<string | null>(null);

  type ProductModal = { open: false } | { open: true; mode: 'create' } | { open: true; mode: 'edit'; product: AdminProduct };
  const [productModal, setProductModal] = useState<ProductModal>({ open: false });

  const EMPTY_FORM = { name: '', sku: '', category: 'CAKES' as ProductCategory, price: '', description: '', imageUrl: '', venueAddress: '' };
  const [productForm, setProductForm] = useState(EMPTY_FORM);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [imgErr, setImgErr] = useState<Record<string, boolean>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [pkgPhotos, setPkgPhotos] = useState<PackagePhoto[]>([]);
  const [pkgPhotoUploading, setPkgPhotoUploading] = useState(false);
  const pkgPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setProductImageUploading(true);
    try {
      const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setProductForm(f => ({ ...f, imageUrl: data.secure_url as string }));
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image. Please try again.' });
    } finally {
      setProductImageUploading(false);
    }
  };

  const handlePkgPhotoUpload = async (file: File) => {
    if (!pkgEditModal.open) return;
    setPkgPhotoUploading(true);
    try {
      const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const photoRes = await adminAPI.addPackagePhoto(pkgEditModal.pkg.id, {
        url: data.secure_url as string,
        publicId: data.public_id as string,
      });
      setPkgPhotos(prev => [...prev, photoRes.data.photo]);
      setPackages(prev => (prev ?? []).map(p =>
        p.id === (pkgEditModal.open ? pkgEditModal.pkg.id : '') ? { ...p, photos: [...p.photos, photoRes.data.photo] } : p
      ));
      toast({ title: 'Photo added' });
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload photo. Please try again.' });
    } finally {
      setPkgPhotoUploading(false);
    }
  };

  const deletePkgPhoto = async (photoId: string) => {
    if (!pkgEditModal.open) return;
    try {
      await adminAPI.deletePackagePhoto(pkgEditModal.pkg.id, photoId);
      setPkgPhotos(prev => prev.filter(ph => ph.id !== photoId));
      setPackages(prev => (prev ?? []).map(p =>
        p.id === (pkgEditModal.open ? pkgEditModal.pkg.id : '') ? { ...p, photos: p.photos.filter(ph => ph.id !== photoId) } : p
      ));
      toast({ title: 'Photo removed' });
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Could not remove photo.' });
    }
  };

  const TASK_CATEGORIES: { value: string; label: string }[] = [
    { value: 'CAKE',                  label: 'Cake' },
    { value: 'DECORATIONS',           label: 'Decorations' },
    { value: 'FOOD',                  label: 'Food & Catering' },
    { value: 'ENTERTAINMENT',         label: 'Entertainment' },
    { value: 'PHOTOGRAPHY',           label: 'Photography' },
    { value: 'GIFTS',                 label: 'Gifts' },
    { value: 'VENUE',                 label: 'Venue' },
    { value: 'FLOWERS',               label: 'Flowers' },
    { value: 'CELEBRATION_DINNER',    label: 'Celebration Dinner' },
    { value: 'GAMES',                 label: 'Games' },
    { value: 'PARTY_FAVORS',          label: 'Party Favors' },
    { value: 'GAMES_AND_ACTIVITIES',  label: 'Games & Activities' },
  ];

  type TemplateModal = { open: false } | { open: true; mode: 'create' } | { open: true; mode: 'edit'; template: AdminTemplate };
  const EMPTY_TEMPLATE_FORM = { name: '', emoji: '', description: '', steps: [] as string[] };
  const [templateModal, setTemplateModal] = useState<TemplateModal>({ open: false });
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);

  const openCreateTemplate = () => { setTemplateForm(EMPTY_TEMPLATE_FORM); setTemplateModal({ open: true, mode: 'create' }); };
  const openEditTemplate   = (t: AdminTemplate) => {
    setTemplateForm({ name: t.name, emoji: t.emoji ?? '', description: '', steps: [] });
    setTemplateModal({ open: true, mode: 'edit', template: t });
  };
  const closeTemplateModal = () => setTemplateModal({ open: false });

  const toggleStep = (value: string) => {
    setTemplateForm(f => ({
      ...f,
      steps: f.steps.includes(value) ? f.steps.filter(s => s !== value) : [...f.steps, value],
    }));
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) { toast({ variant: 'destructive', title: 'Template name is required' }); return; }
    if (templateModal.open && templateModal.mode === 'create' && templateForm.steps.length === 0) {
      toast({ variant: 'destructive', title: 'Select at least one planning step' }); return;
    }
    setLoading(s => ({ ...s, templateSave: true }));
    try {
      const stepsToObjects = (cats: string[]): TemplateStepInput[] =>
        cats.map(cat => ({ category: cat, title: TASK_CATEGORIES.find(c => c.value === cat)?.label ?? cat }));

      if (templateModal.open && templateModal.mode === 'create') {
        const payload: CreateTemplateRequest = {
          name: templateForm.name.trim(),
          ...(templateForm.emoji.trim()       && { emoji:       templateForm.emoji.trim() }),
          ...(templateForm.description.trim() && { description: templateForm.description.trim() }),
          steps: stepsToObjects(templateForm.steps),
        };
        const res = await adminAPI.createTemplate(payload);
        setTemplates(prev => [res.data.template, ...(prev ?? [])]);
        toast({ title: 'Template created', description: res.data.template.name });
      } else if (templateModal.open && templateModal.mode === 'edit') {
        const payload: UpdateTemplateRequest = {
          name:  templateForm.name.trim()  || undefined,
          emoji: templateForm.emoji.trim() || null,
          ...(templateForm.description.trim() && { description: templateForm.description.trim() }),
          ...(templateForm.steps.length > 0   && { steps: stepsToObjects(templateForm.steps) }),
        };
        const res = await adminAPI.updateTemplate(templateModal.template.id, payload);
        setTemplates(prev => (prev ?? []).map(t => t.id === res.data.template.id ? res.data.template : t));
        toast({ title: 'Template updated', description: res.data.template.name });
      }
      closeTemplateModal();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save failed', description: err instanceof Error ? err.message : 'Could not save template' });
    } finally {
      setLoading(s => ({ ...s, templateSave: false }));
    }
  };

  const openCreate = () => { setProductForm(EMPTY_FORM); setProductModal({ open: true, mode: 'create' }); };
  const openEdit   = (p: AdminProduct) => {
    setProductForm({
      name: p.name, sku: p.sku,
      category: p.category,
      price: String(typeof p.price === 'number' ? p.price.toFixed(2) : p.price),
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      venueAddress: p.venueAddress ?? '',
    });
    setProductModal({ open: true, mode: 'edit', product: p });
  };
  const closeModal = () => setProductModal({ open: false });

  const toNumber = (v: number | string) => {
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totals = useMemo(() => stats ? { ...stats, totalRevenue: toNumber(stats.totalRevenue) } : null, [stats]);

  const orderStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING_PAYMENT: 'Pending Payment', PAID: 'Paid', PREPARING: 'Preparing',
      READY_FOR_PICKUP: 'Ready', OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered', CANCELED: 'Canceled',
    };
    return map[status] ?? status;
  };

  const ORDER_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
    PENDING_PAYMENT:  { bg: 'hsl(43,74%,95%)',  color: 'hsl(38,80%,30%)' },
    PAID:             { bg: 'hsl(142,60%,94%)', color: 'hsl(142,65%,22%)' },
    PREPARING:        { bg: 'hsl(210,80%,94%)', color: 'hsl(210,75%,25%)' },
    READY_FOR_PICKUP: { bg: 'hsl(270,60%,94%)', color: 'hsl(270,60%,30%)' },
    OUT_FOR_DELIVERY: { bg: 'hsl(25,90%,94%)',  color: 'hsl(25,85%,30%)' },
    DELIVERED:        { bg: 'hsl(155,40%,94%)', color: 'hsl(155,42%,20%)' },
    CANCELED:         { bg: 'hsl(0,70%,96%)',   color: 'hsl(0,65%,40%)' },
  };

  const DELIVERY_PIPELINE: { key: string; label: string }[] = [
    { key: 'PENDING_PAYMENT', label: 'Pending' },
    { key: 'PAID',            label: 'Paid' },
    { key: 'PREPARING',       label: 'Preparing' },
    { key: 'READY_FOR_PICKUP',label: 'Ready' },
    { key: 'OUT_FOR_DELIVERY',label: 'Delivery' },
    { key: 'DELIVERED',       label: 'Delivered' },
  ];

  const formatDate = (dateIso: string) => {
    const d = new Date(dateIso);
    return Number.isNaN(d.getTime()) ? dateIso : d.toISOString().slice(0, 10);
  };

  const loadStatsAndOrders = async () => {
    setLoadError(null);
    setLoading(s => ({ ...s, stats: true, orders: true }));
    try {
      const [statsRes, ordersRes] = await Promise.all([adminAPI.getStats(), adminAPI.listOrders(20)]);
      setStats({ totalCustomers: statsRes.data.totalCustomers, totalOrders: statsRes.data.totalOrders, totalRevenue: toNumber(statsRes.data.totalRevenue), pendingOrders: statsRes.data.pendingOrders });
      setOrders(ordersRes.data.orders);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(s => ({ ...s, stats: false, orders: false }));
    }
  };

  const loadProducts = async () => {
    setLoadError(null);
    setLoading(s => ({ ...s, products: true }));
    try {
      const res = await adminAPI.listProducts(200);
      setProducts(res.data.products);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(s => ({ ...s, products: false }));
    }
  };

  const loadTemplates = async () => {
    setLoadError(null);
    setLoading(s => ({ ...s, templates: true }));
    try {
      const res = await adminAPI.listTemplates(200);
      setTemplates(res.data.templates);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(s => ({ ...s, templates: false }));
    }
  };

  const loadPackages = async () => {
    setLoadError(null);
    setLoading(s => ({ ...s, packages: true }));
    try {
      const res = await adminAPI.listPackages();
      setPackages(res.data.packages);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(s => ({ ...s, packages: false }));
    }
  };

  const loadCustomers = async () => {
    setLoadError(null);
    setLoading(s => ({ ...s, customers: true }));
    try {
      const res = await adminAPI.listCustomers();
      setCustomers(res.data.customers);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(s => ({ ...s, customers: false }));
    }
  };

  const togglePackageActive = async (pkgId: string, isActive: boolean) => {
    try {
      const res = await adminAPI.updatePackage(pkgId, { isActive });
      setPackages(prev => (prev ?? []).map(p => p.id === pkgId ? { ...p, ...res.data.package } : p));
      toast({ title: 'Package updated', description: isActive ? 'Package activated' : 'Package deactivated' });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Update failed', description: err instanceof Error ? err.message : 'Could not update package' });
    }
  };

  const loadBroadcasts = async () => {
    setLoading(s => ({ ...s, broadcasts: true }));
    try {
      const res = await adminAPI.getBroadcasts();
      setBroadcasts(res.data.broadcasts);
    } catch {}
    finally {
      setLoading(s => ({ ...s, broadcasts: false }));
    }
  };

  useEffect(() => { if (!stats || !orders) void loadStatsAndOrders(); }, []); // eslint-disable-line
  useEffect(() => {
    if (adminTab === 'products'       && !products   && !loading.products)   void loadProducts();
    if (adminTab === 'templates'      && !templates  && !loading.templates)  void loadTemplates();
    if (adminTab === 'packages'       && !packages   && !loading.packages)   void loadPackages();
    if (adminTab === 'customers'      && !customers  && !loading.customers)  void loadCustomers();
    if (adminTab === 'notifications'  && !broadcasts && !loading.broadcasts) void loadBroadcasts();
    if (adminTab === 'operations'     && !operations) {
      adminOperationsAPI.list().then(res => setOperations(res.data.events)).catch(() => {});
    }
  }, [adminTab]); // eslint-disable-line

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await adminAPI.updateOrderStatus(orderId, status);
      setOrders(prev => (prev ?? []).map(o => o.id === orderId ? res.data.order : o));
      toast({ title: 'Order updated', description: `Status set to ${orderStatusLabel(status)}` });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Update failed', description: err instanceof Error ? err.message : 'Could not update order' });
    }
  };

  const setProductActive = async (productId: string, isActive: boolean) => {
    try {
      const res = await adminAPI.setProductActive(productId, isActive);
      setProducts(prev => (prev ?? []).map(p => p.id === productId ? res.data.product : p));
      toast({ title: 'Product updated', description: isActive ? 'Product activated' : 'Product deactivated' });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Update failed', description: err instanceof Error ? err.message : 'Could not update product' });
    }
  };

  const setTemplateActive = async (templateId: string, isActive: boolean) => {
    try {
      const res = await adminAPI.setTemplateActive(templateId, isActive);
      setTemplates(prev => (prev ?? []).map(t => t.id === templateId ? res.data.template : t));
      toast({ title: 'Template updated', description: isActive ? 'Template activated' : 'Template deactivated' });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Update failed', description: err instanceof Error ? err.message : 'Could not update template' });
    }
  };

  const saveProduct = async () => {
    const price = parseFloat(productForm.price);
    if (!productForm.name.trim()) { toast({ variant: 'destructive', title: 'Name is required' }); return; }
    if (Number.isNaN(price) || price < 0) { toast({ variant: 'destructive', title: 'Enter a valid price' }); return; }

    setLoading(s => ({ ...s, productSave: true }));
    try {
      if (productModal.open && productModal.mode === 'create') {
        const payload: CreateProductRequest = {
          name: productForm.name.trim(),
          category: productForm.category,
          price,
          ...(productForm.sku.trim()          && { sku:          productForm.sku.trim() }),
          ...(productForm.description.trim()  && { description:  productForm.description.trim() }),
          ...(productForm.imageUrl.trim()     && { imageUrl:     productForm.imageUrl.trim() }),
          ...(productForm.venueAddress.trim() && { venueAddress: productForm.venueAddress.trim() }),
        };
        const res = await adminAPI.createProduct(payload);
        setProducts(prev => [res.data.product, ...(prev ?? [])]);
        toast({ title: 'Product created', description: res.data.product.name });
      } else if (productModal.open && productModal.mode === 'edit') {
        const payload: UpdateProductRequest = {
          name:         productForm.name.trim()          || undefined,
          price,
          description:  productForm.description.trim()   || null,
          imageUrl:     productForm.imageUrl.trim()      || null,
          venueAddress: productForm.venueAddress.trim()  || null,
        };
        const res = await adminAPI.updateProduct(productModal.product.id, payload);
        setProducts(prev => (prev ?? []).map(p => p.id === res.data.product.id ? res.data.product : p));
        toast({ title: 'Product updated', description: res.data.product.name });
      }
      closeModal();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save failed', description: err instanceof Error ? err.message : 'Could not save product' });
    } finally {
      setLoading(s => ({ ...s, productSave: false }));
    }
  };

  const submitNotification = async () => {
    setLoading(s => ({ ...s, notification: true }));
    try {
      await adminAPI.sendNotification(notificationForm);
      toast({ title: 'Notification sent', description: 'Your message was queued.' });
      setNotificationForm(f => ({ ...f, title: '', content: '' }));
      void loadBroadcasts();
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: 'Send failed', description: err instanceof Error ? err.message : 'Could not send notification' });
    } finally {
      setLoading(s => ({ ...s, notification: false }));
    }
  };

  const openPkgEdit = (pkg: AdminPackage) => {
    setPkgForm({
      name:        pkg.name,
      description: pkg.description,
      highlights:  pkg.highlights.join('\n'),
      items:       pkg.items.map(i => ({ productId: i.productId, name: i.name, category: i.category, price: i.price, quantity: i.quantity, isCore: i.isCore })),
    });
    setPkgPhotos(pkg.photos ?? []);
    setPkgAddProductId('');
    setPkgEditModal({ open: true, pkg });
    if (!products && !loading.products) void loadProducts();
  };
  const closePkgEdit = () => setPkgEditModal({ open: false });

  const savePkgEdit = async () => {
    if (!pkgEditModal.open) return;
    const name        = pkgForm.name.trim();
    const description = pkgForm.description.trim();
    const highlights  = pkgForm.highlights.split('\n').map(h => h.trim()).filter(Boolean);
    if (!name) { toast({ variant: 'destructive', title: 'Package name is required' }); return; }
    setLoading(s => ({ ...s, pkgSave: true }));
    try {
      const res = await adminAPI.updatePackage(pkgEditModal.pkg.id, {
        name,
        description: description || undefined,
        highlights:  highlights.length ? highlights : undefined,
        items:       pkgForm.items.map(i => ({ productId: i.productId, quantity: i.quantity, isCore: i.isCore })),
      });
      setPackages(prev => (prev ?? []).map(p => p.id === res.data.package.id ? { ...p, ...res.data.package } : p));
      toast({ title: 'Package updated', description: name });
      closePkgEdit();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Save failed', description: err instanceof Error ? err.message : 'Could not save package' });
    } finally {
      setLoading(s => ({ ...s, pkgSave: false }));
    }
  };

  const openOrderDetail = async (orderId: string) => {
    setOrderDetailModal({ open: true, order: null, loading: true });
    try {
      const res = await adminAPI.getOrder(orderId);
      setOrderDetailModal({ open: true, order: res.data.order, loading: false });
    } catch {
      setOrderDetailModal({ open: false });
      toast({ variant: 'destructive', title: 'Failed to load order details' });
    }
  };
  const closeOrderDetail = () => setOrderDetailModal({ open: false });

  const searchBar = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className='relative mb-4'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4' style={{ color: 'hsl(150,10%,55%)' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className='w-full pl-9 pr-4 h-10 rounded-xl border-2 text-sm bg-white outline-none transition-colors focus:border-green-700'
        style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,45%,13%)' }}
      />
      {value && (
        <button onClick={() => onChange('')} className='absolute right-3 top-1/2 -translate-y-1/2 text-xs'
          style={{ color: 'hsl(150,10%,55%)' }}><X className='w-3.5 h-3.5' /></button>
      )}
    </div>
  );

  const sectionHeader = (title: string, subtitle: string, action?: React.ReactNode) => (
    <div className='flex items-start justify-between gap-4 mb-6 animate-fade-in'>
      <div>
        <h2 className='font-serif text-3xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>{title}</h2>
        <p className='text-sm mt-1' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );

  const card = (children: React.ReactNode, className = '') => (
    <div className={`bg-white rounded-2xl border overflow-hidden ${className}`} style={{ borderColor: 'hsl(150,12%,88%)' }}>
      {children}
    </div>
  );

  const tableCard = (children: React.ReactNode) => (
    <div className='bg-white rounded-2xl border overflow-hidden' style={{ borderColor: 'hsl(150,12%,88%)' }}>
      <div className='overflow-x-auto'>
        <Table>{children}</Table>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen' style={{ background: 'hsl(150,15%,97%)' }}>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>

        {/* ── Overview ── */}
        {adminTab === 'overview' && (
          <div className='space-y-8'>
            <div className='flex items-start justify-between gap-4 animate-fade-in'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>Admin Panel</span>
                </div>
                <h2 className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>Dashboard Overview</h2>
              </div>
              <Button type='button' variant='outline' onClick={() => void loadStatsAndOrders()}
                className='rounded-xl gap-2 shrink-0 mt-1'
                style={{ borderColor: 'hsl(150,12%,82%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                <RefreshCw className='w-4 h-4' />Refresh
              </Button>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in'>
              {[
                { label: 'Total Customers', icon: Users,      value: totals?.totalCustomers, color: 'hsl(155,42%,20%)', bg: 'hsl(155,25%,97%)' },
                { label: 'Total Orders',    icon: ShoppingCart,value: totals?.totalOrders,    color: 'hsl(43,74%,45%)',  bg: 'hsl(43,74%,97%)' },
                { label: 'Revenue',         icon: TrendingUp,  value: totals ? `$${Number(totals.totalRevenue).toLocaleString()}` : null, color: 'hsl(155,25%,42%)', bg: 'hsl(150,18%,97%)' },
                { label: 'Pending Orders',  icon: BarChart3,   value: totals?.pendingOrders,  color: 'hsl(0,70%,50%)',   bg: 'hsl(0,70%,97%)' },
              ].map(({ label, icon: Icon, value, color, bg }) => (
                <div key={label} className='rounded-2xl p-6 border luxury-card' style={{ background: bg, borderColor: `${color}22` }}>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='w-11 h-11 rounded-xl flex items-center justify-center' style={{ background: `${color}18` }}>
                      <Icon className='w-5 h-5' style={{ color }} />
                    </div>
                  </div>
                  <p className='text-xs uppercase tracking-widest font-semibold mb-1' style={{ color, fontFamily: 'Inter, sans-serif' }}>{label}</p>
                  {loading.stats
                    ? <span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}><Spinner className='w-4 h-4' />Loading</span>
                    : <p className='font-serif text-4xl font-bold' style={{ color: 'hsl(155,45%,11%)' }}>{value ?? '—'}</p>
                  }
                </div>
              ))}
            </div>

            {loadError && (
              <div className='rounded-2xl border p-4 flex items-center justify-between gap-3'
                style={{ borderColor: 'hsl(0,84%,80%)', background: 'hsl(0,84%,97%)' }}>
                <p className='text-sm font-medium' style={{ color: 'hsl(0,72%,45%)', fontFamily: 'Inter, sans-serif' }}>{loadError}</p>
                <Button type='button' variant='outline' size='sm' className='rounded-xl shrink-0'
                  onClick={() => void loadStatsAndOrders()}>Retry</Button>
              </div>
            )}

            {/* Recent orders */}
            <div>
              <h3 className='font-serif text-xl font-bold mb-4' style={{ color: 'hsl(155,45%,13%)' }}>Recent Orders</h3>
              {tableCard(
                <>
                  <TableHeader>
                    <TableRow style={{ background: 'hsl(150,15%,97%)' }}>
                      {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                        <TableHead key={h} className='text-xs uppercase tracking-widest font-bold' style={{ color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading.orders && <TableRow><TableCell colSpan={5} className='py-10 text-center'><span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}><Spinner className='w-4 h-4' />Loading orders…</span></TableCell></TableRow>}
                    {!loading.orders && (orders?.length ?? 0) === 0 && <TableRow><TableCell colSpan={5} className='py-10 text-center text-sm' style={{ color: 'hsl(150,10%,52%)' }}>No orders yet</TableCell></TableRow>}
                    {(orders ?? []).slice(0, 10).map(o => {
                      const sc = ORDER_STATUS_COLOR[o.status] ?? { bg: 'hsl(150,12%,93%)', color: 'hsl(150,10%,42%)' };
                      return (
                        <TableRow key={o.id}>
                          <TableCell className='font-mono text-xs' style={{ color: 'hsl(155,25%,42%)' }}>{o.orderNumber}</TableCell>
                          <TableCell className='font-semibold text-sm' style={{ color: 'hsl(155,45%,13%)' }}>{o.customer}</TableCell>
                          <TableCell className='font-semibold text-sm' style={{ color: 'hsl(43,60%,30%)' }}>${toNumber(o.totalAmount)}</TableCell>
                          <TableCell>
                            <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold'
                              style={{ background: sc.bg, color: sc.color, fontFamily: 'Inter, sans-serif' }}>
                              {orderStatusLabel(o.status)}
                            </span>
                          </TableCell>
                          <TableCell className='text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                            {o.eventDate ? (
                              <span>
                                <span className='font-semibold' style={{ color: 'hsl(155,45%,20%)' }}>
                                  {formatDate(o.eventDate)}
                                </span>
                                {o.eventTime && <span className='ml-1 text-xs'>· {o.eventTime}</span>}
                              </span>
                            ) : formatDate(o.date)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Products ── */}
        {adminTab === 'products' && (
          <div className='space-y-6'>
            {sectionHeader('Product Management', 'Manage catalog items and inventory',
              <Button onClick={openCreate} className='rounded-xl font-semibold gap-1.5 shrink-0 mt-1 transition-all hover:scale-[1.02]'
                style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}>
                <Plus className='w-4 h-4' />Add Product
              </Button>
            )}
            {searchBar(productSearch, setProductSearch, 'Search by name, SKU or category…')}
            {/* Product card grid */}
            {loading.products ? (
              <div className='flex justify-center py-16'><Spinner className='w-6 h-6' /></div>
            ) : (products?.length ?? 0) === 0 ? (
              <div className='text-center py-16 text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>No products found</div>
            ) : (() => {
              const PROD_EMOJI: Record<string, string> = { CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁', PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️' };
              const filtered = (products ?? []).filter(p => {
                const q = productSearch.toLowerCase();
                return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
              });
              return (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                  {filtered.map(p => (
                    <div key={p.id}
                      className='bg-white rounded-2xl border overflow-hidden flex flex-col transition-all hover:shadow-md'
                      style={{ borderColor: p.isActive ? 'hsl(150,12%,88%)' : 'hsl(150,10%,90%)', opacity: p.isActive ? 1 : 0.65 }}>
                      {/* Thumbnail */}
                      <div className='relative h-32 flex items-center justify-center overflow-hidden'
                        style={{ background: 'linear-gradient(135deg, hsl(150,18%,97%), hsl(150,15%,96%))' }}>
                        {p.imageUrl && !imgErr[p.id] ? (
                          <img src={p.imageUrl} alt={p.name} className='w-full h-full object-cover'
                            onError={() => setImgErr(e => ({ ...e, [p.id]: true }))} />
                        ) : (
                          <span className='text-4xl select-none'>{PROD_EMOJI[p.category] ?? '🛍️'}</span>
                        )}
                        {!p.isActive && (
                          <div className='absolute inset-0 flex items-center justify-center'
                            style={{ background: 'rgba(200,200,200,0.35)' }}>
                            <span className='text-xs font-bold px-2 py-0.5 rounded-full bg-white/80'
                              style={{ color: 'hsl(150,8%,52%)' }}>Inactive</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className='p-3 flex flex-col flex-1 gap-1'>
                        <p className='font-semibold text-sm leading-snug line-clamp-2'
                          style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{p.name}</p>
                        <div className='flex items-center gap-1.5 flex-wrap mt-0.5'>
                          <span className='font-mono text-xs px-1.5 py-0.5 rounded'
                            style={{ background: 'hsl(150,12%,95%)', color: 'hsl(155,25%,42%)' }}>{p.sku}</span>
                          <span className='text-xs capitalize'
                            style={{ color: 'hsl(150,10%,55%)', fontFamily: 'Inter, sans-serif' }}>{p.category.toLowerCase()}</span>
                        </div>
                        <p className='font-bold text-sm mt-1'
                          style={{ color: 'hsl(43,60%,30%)', fontFamily: 'Inter, sans-serif' }}>${toNumber(p.price).toFixed(2)}</p>
                        {/* Actions */}
                        <div className='flex items-center gap-0 mt-auto pt-2 border-t'
                          style={{ borderColor: 'hsl(150,12%,92%)' }}>
                          <Button type='button' variant='link' className='h-auto px-0 text-xs flex-1 justify-start'
                            onClick={() => openEdit(p)}>Edit</Button>
                          {p.isActive
                            ? <Button type='button' variant='link' className='h-auto px-0 text-xs text-destructive flex-1 justify-end'
                                onClick={() => void setProductActive(p.id, false)}>Deactivate</Button>
                            : <Button type='button' variant='link' className='h-auto px-0 text-xs flex-1 justify-end'
                                onClick={() => void setProductActive(p.id, true)}>Activate</Button>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Product create / edit modal ── */}
        {productModal.open && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ background: 'rgba(20,10,40,0.55)', backdropFilter: 'blur(4px)' }}>
            <div className='w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in'>
              {/* Header */}
              <div className='px-6 py-5 flex items-center justify-between' style={{ background: 'linear-gradient(135deg, hsl(155,45%,13%), hsl(155,38%,20%))' }}>
                <div className='h-px absolute top-0 left-0 right-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />
                <div className='flex items-center gap-3'>
                  <Package className='w-5 h-5' style={{ color: 'hsl(43,74%,60%)' }} />
                  <h2 className='font-serif text-xl font-bold text-white'>
                    {productModal.mode === 'create' ? 'Add New Product' : 'Edit Product'}
                  </h2>
                </div>
                <button onClick={closeModal} className='text-white/60 hover:text-white transition-colors'><X className='w-5 h-5' /></button>
              </div>

              {/* Form */}
              <div className='p-6 space-y-4 max-h-[75vh] overflow-y-auto'>
                {/* Name */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Product Name *</label>
                  <Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                    className={inputClass} style={inputStyle} placeholder='e.g. Chocolate Birthday Cake' />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  {/* Category */}
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Category *</label>
                    <select value={productForm.category}
                      onChange={e => setProductForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
                      disabled={productModal.mode === 'edit'}
                      className='h-11 w-full rounded-xl border-2 px-3 text-sm bg-white'
                      style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,22%,38%)' }}>
                      {(['CAKES','DECORATIONS','FOOD','GIFTS','PHOTOGRAPHY','ENTERTAINMENT','VENUE'] as ProductCategory[]).map(c => (
                        <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Price (USD) *</label>
                    <Input type='number' min='0' step='0.01' value={productForm.price}
                      onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                      className={inputClass} style={inputStyle} placeholder='0.00' />
                  </div>
                </div>

                {/* SKU (create only) */}
                {productModal.mode === 'create' && (
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>SKU <span style={{ color: 'hsl(150,8%,58%)' }}>(auto-generated if blank)</span></label>
                    <Input value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))}
                      className={inputClass} style={inputStyle} placeholder='e.g. CAK-CHOC-1234' />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Description</label>
                  <Input value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                    className={inputClass} style={inputStyle} placeholder='Short product description' />
                </div>

                {/* Product Image */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Product Image</label>
                  <input
                    ref={imageInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                  {productForm.imageUrl ? (
                    <div className='relative rounded-xl overflow-hidden border-2 group' style={{ borderColor: 'hsl(150,12%,85%)', height: '140px' }}>
                      <img src={productForm.imageUrl} alt='Product' className='w-full h-full object-cover' />
                      <div className='absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'
                        style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <button type='button' onClick={() => imageInputRef.current?.click()}
                          className='px-3 py-1.5 rounded-lg text-xs font-semibold text-white'
                          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)' }}>
                          Change
                        </button>
                        <button type='button' onClick={() => setProductForm(f => ({ ...f, imageUrl: '' }))}
                          className='px-3 py-1.5 rounded-lg text-xs font-semibold text-white'
                          style={{ background: 'rgba(200,40,40,0.55)', border: '1px solid rgba(255,100,100,0.3)' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => imageInputRef.current?.click()}
                      disabled={productImageUploading}
                      className='w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 transition-colors hover:border-green-600/50 disabled:opacity-50 disabled:cursor-not-allowed'
                      style={{ borderColor: 'hsl(150,12%,82%)', background: 'hsl(150,15%,98%)' }}
                    >
                      {productImageUploading ? (
                        <>
                          <span className='size-6 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(155,30%,75%)', borderTopColor: 'hsl(155,38%,27%)' }} />
                          <span className='text-xs' style={{ color: 'hsl(150,8%,55%)', fontFamily: 'Inter, sans-serif' }}>Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload className='w-5 h-5' style={{ color: 'hsl(155,20%,52%)' }} />
                          <div className='text-center'>
                            <p className='text-sm font-semibold' style={{ color: 'hsl(155,30%,35%)', fontFamily: 'Inter, sans-serif' }}>Click to upload image</p>
                            <p className='text-xs mt-0.5' style={{ color: 'hsl(150,8%,58%)', fontFamily: 'Inter, sans-serif' }}>PNG, JPG, WebP · max 5 MB</p>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Venue Address (only for VENUE category) */}
                {productForm.category === 'VENUE' && (
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Venue Address</label>
                    <Input value={productForm.venueAddress} onChange={e => setProductForm(f => ({ ...f, venueAddress: e.target.value }))}
                      className={inputClass} style={inputStyle} placeholder='123 Grand Ave, City' />
                  </div>
                )}

                {/* Actions */}
                <div className='flex gap-3 pt-2'>
                  <Button type='button' variant='outline' onClick={closeModal} disabled={loading.productSave}
                    className='flex-1 rounded-xl font-semibold'
                    style={{ borderColor: 'hsl(150,12%,80%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                    Cancel
                  </Button>
                  <Button type='button' onClick={() => void saveProduct()} disabled={loading.productSave}
                    className='flex-1 rounded-xl font-semibold gap-2'
                    style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                    {loading.productSave && <Spinner className='w-4 h-4' />}
                    {loading.productSave ? 'Saving…' : productModal.mode === 'create' ? 'Create Product' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Template create / edit modal ── */}
        {templateModal.open && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ background: 'rgba(20,10,40,0.55)', backdropFilter: 'blur(4px)' }}>
            <div className='w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in'>
              {/* Header */}
              <div className='px-6 py-5 flex items-center justify-between relative' style={{ background: 'linear-gradient(135deg, hsl(155,45%,13%), hsl(155,38%,20%))' }}>
                <div className='h-px absolute top-0 left-0 right-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />
                <div className='flex items-center gap-3'>
                  <LayoutTemplate className='w-5 h-5' style={{ color: 'hsl(43,74%,60%)' }} />
                  <h2 className='font-serif text-xl font-bold text-white'>
                    {templateModal.mode === 'create' ? 'New Event Template' : 'Edit Template'}
                  </h2>
                </div>
                <button onClick={closeTemplateModal} className='text-white/60 hover:text-white transition-colors'><X className='w-5 h-5' /></button>
              </div>

              {/* Form */}
              <div className='p-6 space-y-4 max-h-[75vh] overflow-y-auto'>
                <div className='grid grid-cols-[1fr_auto] gap-4'>
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Template Name *</label>
                    <Input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                      className={inputClass} style={inputStyle} placeholder='e.g. Birthday Party Planner' />
                  </div>
                  <div>
                    <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Emoji</label>
                    <Input value={templateForm.emoji} onChange={e => setTemplateForm(f => ({ ...f, emoji: e.target.value }))}
                      className={`${inputClass} w-16 text-center text-xl`} style={inputStyle} placeholder='🎉' maxLength={4} />
                  </div>
                </div>

                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={labelStyle}>Description</label>
                  <Input value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))}
                    className={inputClass} style={inputStyle} placeholder='Brief description of this template' />
                </div>

                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-2' style={labelStyle}>
                    Planning Steps
                    {templateModal.mode === 'edit' && (
                      <span className='ml-2 normal-case font-normal' style={{ color: 'hsl(150,8%,58%)' }}>
                        (leave all unchecked to keep existing steps)
                      </span>
                    )}
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {TASK_CATEGORIES.map(cat => {
                      const selected = templateForm.steps.includes(cat.value);
                      return (
                        <button
                          key={cat.value}
                          type='button'
                          onClick={() => toggleStep(cat.value)}
                          className='flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold text-left transition-all'
                          style={{
                            borderColor: selected ? 'hsl(155,35%,32%)' : 'hsl(150,12%,88%)',
                            background:  selected ? 'hsl(155,30%,95%)' : 'white',
                            color:       selected ? 'hsl(155,42%,20%)' : 'hsl(150,10%,52%)',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-xs font-bold ${selected ? 'text-white' : ''}`}
                            style={{ background: selected ? 'hsl(155,35%,32%)' : 'hsl(150,12%,88%)' }}>
                            {selected ? '✓' : ''}
                          </span>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {templateForm.steps.length > 0 && (
                    <p className='text-xs mt-2' style={{ color: 'hsl(155,22%,46%)', fontFamily: 'Inter, sans-serif' }}>
                      {templateForm.steps.length} step{templateForm.steps.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className='flex gap-3 pt-2'>
                  <Button type='button' variant='outline' onClick={closeTemplateModal} disabled={loading.templateSave}
                    className='flex-1 rounded-xl font-semibold'
                    style={{ borderColor: 'hsl(150,12%,80%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                    Cancel
                  </Button>
                  <Button type='button' onClick={() => void saveTemplate()} disabled={loading.templateSave}
                    className='flex-1 rounded-xl font-semibold gap-2'
                    style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                    {loading.templateSave && <Spinner className='w-4 h-4' />}
                    {loading.templateSave ? 'Saving…' : templateModal.mode === 'create' ? 'Create Template' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {adminTab === 'orders' && (
          <div className='space-y-5'>
            {sectionHeader('Order Management', 'Track and update order statuses')}

            {/* Search + refresh */}
            <div className='flex gap-3 items-center'>
              {searchBar(orderSearch, setOrderSearch, 'Search by order number or customer…')}
              <Button type='button' variant='outline' size='sm' className='rounded-xl gap-2 shrink-0'
                onClick={() => void loadStatsAndOrders()}>
                <RefreshCw className='w-4 h-4' />Refresh
              </Button>
            </div>

            {/* Status filter tabs */}
            <div className='flex flex-wrap gap-2'>
              {[
                { key: 'ALL',              label: 'All Orders' },
                { key: 'PAID',             label: 'Paid' },
                { key: 'PREPARING',        label: 'Preparing' },
                { key: 'READY_FOR_PICKUP', label: 'Ready' },
                { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
                { key: 'DELIVERED',        label: 'Delivered' },
                { key: 'CANCELED',         label: 'Canceled' },
              ].map(({ key, label }) => {
                const count = key === 'ALL' ? (orders?.length ?? 0) : (orders?.filter(o => o.status === key).length ?? 0);
                const active = orderStatusFilter === key;
                const col = key === 'ALL' ? { bg: 'hsl(155,42%,20%)', light: 'hsl(155,25%,96%)' } : { bg: ORDER_STATUS_COLOR[key]?.color ?? 'hsl(155,42%,20%)', light: ORDER_STATUS_COLOR[key]?.bg ?? 'hsl(155,25%,96%)' };
                return (
                  <button key={key} onClick={() => setOrderStatusFilter(key)}
                    className='px-3 py-1.5 rounded-full text-xs font-semibold transition-all border'
                    style={{
                      background:   active ? col.bg   : col.light,
                      color:        active ? 'white'  : col.bg,
                      borderColor:  active ? col.bg   : 'transparent',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                    {label} {count > 0 && <span className='ml-1 opacity-75'>({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Orders table */}
            {tableCard(
              <>
                <TableHeader>
                  <TableRow style={{ background: 'hsl(150,15%,97%)' }}>
                    {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                      <TableHead key={h} className='text-xs uppercase tracking-widest font-bold' style={{ color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.orders && (
                    <TableRow><TableCell colSpan={6} className='py-10 text-center'>
                      <span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}><Spinner className='w-4 h-4' />Loading orders…</span>
                    </TableCell></TableRow>
                  )}
                  {!loading.orders && (orders?.length ?? 0) === 0 && (
                    <TableRow><TableCell colSpan={6} className='py-10 text-center text-sm' style={{ color: 'hsl(150,10%,52%)' }}>No orders yet</TableCell></TableRow>
                  )}
                  {(orders ?? []).filter(o => {
                    const q = orderSearch.toLowerCase();
                    const matchesSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
                    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).map(o => {
                    const sc = ORDER_STATUS_COLOR[o.status] ?? { bg: 'hsl(150,12%,93%)', color: 'hsl(150,10%,42%)' };
                    const pipelineIdx = DELIVERY_PIPELINE.findIndex(p => p.key === o.status);
                    return (
                      <TableRow key={o.id} className='group'>
                        <TableCell>
                          <div className='font-mono text-xs' style={{ color: 'hsl(155,25%,42%)' }}>{o.orderNumber}</div>
                        </TableCell>
                        <TableCell className='font-semibold text-sm' style={{ color: 'hsl(155,45%,13%)' }}>{o.customer}</TableCell>
                        <TableCell className='font-semibold text-sm' style={{ color: 'hsl(43,60%,30%)' }}>${toNumber(o.totalAmount)}</TableCell>
                        <TableCell>
                          <div className='space-y-2'>
                            {/* Status badge */}
                            <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold'
                              style={{ background: sc.bg, color: sc.color, fontFamily: 'Inter, sans-serif' }}>
                              {orderStatusLabel(o.status)}
                            </span>
                            {/* Pipeline progress dots */}
                            {o.status !== 'CANCELED' && (
                              <div className='flex items-center gap-1'>
                                {DELIVERY_PIPELINE.map((p, i) => (
                                  <div key={p.key} className='flex items-center gap-1'>
                                    <div className='w-2 h-2 rounded-full'
                                      style={{ background: i <= pipelineIdx ? sc.color : 'hsl(150,12%,88%)' }} />
                                    {i < DELIVERY_PIPELINE.length - 1 && (
                                      <div className='w-3 h-px' style={{ background: i < pipelineIdx ? sc.color : 'hsl(150,12%,88%)' }} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Update status dropdown */}
                            <select value={o.status} onChange={e => void updateOrderStatus(o.id, e.target.value as OrderStatus)}
                              className='rounded-lg border px-2 h-7 text-xs bg-white w-full'
                              style={{ borderColor: 'hsl(150,12%,85%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,22%,38%)' }}>
                              <option value='PENDING_PAYMENT'>Pending Payment</option>
                              <option value='PAID'>Paid</option>
                              <option value='PREPARING'>Preparing</option>
                              <option value='READY_FOR_PICKUP'>Ready for Pickup</option>
                              <option value='OUT_FOR_DELIVERY'>Out for Delivery</option>
                              <option value='DELIVERED'>Delivered</option>
                              <option value='CANCELED'>Canceled</option>
                            </select>
                          </div>
                        </TableCell>
                        <TableCell className='text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                          {o.eventDate ? (
                            <span>
                              <span className='font-semibold' style={{ color: 'hsl(155,45%,20%)' }}>
                                {formatDate(o.eventDate)}
                              </span>
                              {o.eventTime && <span className='ml-1 text-xs'>· {o.eventTime}</span>}
                              {o.eventVenue && <div className='text-xs mt-0.5 truncate max-w-[140px]'>📍 {o.eventVenue}</div>}
                            </span>
                          ) : formatDate(o.date)}
                        </TableCell>
                        <TableCell>
                          <Button type='button' variant='link' className='h-auto px-0 text-xs gap-1'
                            style={{ color: 'hsl(155,25%,42%)' }}
                            onClick={() => void openOrderDetail(o.id)}>
                            <Eye className='w-3.5 h-3.5' />View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </>
            )}
          </div>
        )}

        {/* ── Templates ── */}
        {adminTab === 'templates' && (
          <div className='space-y-6'>
            {sectionHeader('Event Templates', 'Create and maintain planning templates',
              <Button onClick={openCreateTemplate} className='rounded-xl font-semibold gap-1.5 shrink-0 mt-1 transition-all hover:scale-[1.02]'
                style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                <LayoutTemplate className='w-4 h-4' />New Template
              </Button>
            )}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {loading.templates && (
                card(<div className='py-10 text-center'><span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}><Spinner className='w-4 h-4' />Loading templates…</span></div>)
              )}
              {!loading.templates && (templates?.length ?? 0) === 0 && (
                card(<div className='py-10 text-center text-sm' style={{ color: 'hsl(150,10%,52%)' }}>No templates found</div>)
              )}
              {(templates ?? []).map(t => (
                <div key={t.id} className='bg-white rounded-2xl border overflow-hidden' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                  <div className='h-1' style={{ background: t.isActive ? 'linear-gradient(90deg, hsl(155,38%,27%), hsl(43,74%,49%))' : 'hsl(150,10%,86%)' }} />
                  <div className='p-5'>
                    <div className='flex items-start justify-between gap-3 mb-3'>
                      <h4 className='font-serif text-lg font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                        {t.emoji ? `${t.emoji} ` : ''}{t.name}
                      </h4>
                      <Badge style={t.isActive
                        ? { background: 'hsl(155,30%,95%)', color: 'hsl(155,38%,27%)', border: '1px solid hsl(150,12%,82%)' }
                        : { background: 'hsl(150,8%,96%)', color: 'hsl(150,8%,52%)', border: '1px solid hsl(150,10%,86%)' }}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className='text-sm mb-4' style={{ color: 'hsl(150,8%,50%)', fontFamily: 'Inter, sans-serif' }}>
                      {t.steps} planning steps
                    </p>
                    <div className='flex gap-2'>
                      <Button type='button' variant='outline' className='flex-1 rounded-xl text-sm font-semibold'
                        style={{ borderColor: 'hsl(150,12%,82%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}
                        onClick={() => openEditTemplate(t)}>
                        Edit
                      </Button>
                      {t.isActive
                        ? <Button type='button' className='flex-1 rounded-xl text-sm font-semibold'
                            style={{ background: 'hsl(0,72%,50%)', fontFamily: 'Inter, sans-serif' }}
                            onClick={() => void setTemplateActive(t.id, false)}>Deactivate</Button>
                        : <Button type='button' className='flex-1 rounded-xl text-sm font-semibold'
                            style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}
                            onClick={() => void setTemplateActive(t.id, true)}>Activate</Button>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Packages ── */}
        {adminTab === 'packages' && (() => {
          const TIER_CONFIG: Record<PackageTier, { label: string; color: string; bg: string; border: string }> = {
            BRONZE: { label: 'Bronze', color: 'hsl(30,55%,42%)',  bg: 'hsl(30,60%,97%)',  border: 'hsl(30,50%,80%)' },
            SILVER: { label: 'Silver', color: 'hsl(210,15%,46%)', bg: 'hsl(210,15%,97%)', border: 'hsl(210,15%,82%)' },
            GOLD:   { label: 'Gold',   color: 'hsl(43,74%,38%)',  bg: 'hsl(43,74%,96%)',  border: 'hsl(43,60%,72%)' },
          };

          const EVENT_LABELS: Record<string, string> = {
            BIRTHDAY:    'Birthday',
            WEDDING:     'Wedding',
            PROPOSAL:    'Proposal',
            BABY_SHOWER: 'Baby Shower',
            KIDS_PARTY:  "Kids' Party",
          };

          // Group packages by event type (after applying search filter)
          const filteredPkgs = (packages ?? []).filter(pkg => {
            const q = packageSearch.toLowerCase();
            return !q || pkg.name.toLowerCase().includes(q) || pkg.eventType.toLowerCase().includes(q) || pkg.tier.toLowerCase().includes(q);
          });
          const grouped = filteredPkgs.reduce<Record<string, AdminPackage[]>>((acc, pkg) => {
            (acc[pkg.eventType] ??= []).push(pkg);
            return acc;
          }, {});

          return (
            <div className='space-y-6'>
              {sectionHeader(
                'Package Management',
                'View and toggle Bronze / Silver / Gold packages per event type',
                <Button type='button' variant='outline' onClick={() => void loadPackages()}
                  className='rounded-xl gap-2 shrink-0 mt-1'
                  style={{ borderColor: 'hsl(150,12%,85%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                  <RefreshCw className='w-4 h-4' />Refresh
                </Button>
              )}
              {searchBar(packageSearch, setPackageSearch, 'Search by name, event type or tier…')}

              {loading.packages && (
                <div className='py-16 text-center'>
                  <span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                    <Boxes className='w-4 h-4 animate-pulse' />Loading packages…
                  </span>
                </div>
              )}

              {!loading.packages && (packages?.length ?? 0) === 0 && (
                <div className='py-16 text-center text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                  No packages found. Run the seed script to populate packages.
                </div>
              )}

              {!loading.packages && Object.entries(grouped).map(([eventType, pkgs]) => (
                <div key={eventType} className='space-y-3'>
                  <h3 className='font-serif text-xl font-bold' style={{ color: 'hsl(155,45%,13%)' }}>
                    {EVENT_LABELS[eventType] ?? eventType}
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {(['BRONZE','SILVER','GOLD'] as PackageTier[]).map(tier => {
                      const pkg = pkgs.find(p => p.tier === tier);
                      if (!pkg) return null;
                      const tc = TIER_CONFIG[tier];
                      const isExpanded = expandedPkg === pkg.id;
                      return (
                        <div key={pkg.id} className='bg-white rounded-2xl border overflow-hidden'
                          style={{ borderColor: pkg.isActive ? tc.border : 'hsl(150,10%,88%)' }}>
                          {/* Tier color bar */}
                          <div className='h-1' style={{ background: pkg.isActive ? tc.color : 'hsl(150,10%,88%)' }} />

                          <div className='p-5'>
                            {/* Header row */}
                            <div className='flex items-start justify-between gap-2 mb-3'>
                              <div>
                                <span className='text-xs uppercase tracking-widest font-bold'
                                  style={{ color: tc.color, fontFamily: 'Inter, sans-serif' }}>{tc.label}</span>
                                <h4 className='font-serif text-lg font-bold mt-0.5' style={{ color: 'hsl(155,45%,13%)' }}>{pkg.name}</h4>
                              </div>
                              <Badge style={pkg.isActive
                                ? { background: 'hsl(155,40%,94%)', color: 'hsl(155,42%,22%)', border: '1px solid hsl(155,30%,78%)' }
                                : { background: 'hsl(0,0%,96%)', color: 'hsl(0,0%,52%)', border: '1px solid hsl(0,0%,86%)' }}>
                                {pkg.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            {/* Stats row */}
                            <div className='flex gap-4 mb-4'>
                              <div className='text-center'>
                                <p className='font-serif text-2xl font-bold' style={{ color: tc.color }}>{pkg.itemCount}</p>
                                <p className='text-xs' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Items</p>
                              </div>
                              <div className='text-center'>
                                <p className='font-serif text-2xl font-bold' style={{ color: 'hsl(155,42%,22%)' }}>{pkg.bookedCount}</p>
                                <p className='text-xs' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Bookings</p>
                              </div>
                              <div className='text-center'>
                                <p className='font-serif text-2xl font-bold' style={{ color: (pkg.photos?.length ?? 0) > 0 ? 'hsl(210,70%,40%)' : 'hsl(150,8%,65%)' }}>{pkg.photos?.length ?? 0}</p>
                                <p className='text-xs' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Photos</p>
                              </div>
                            </div>

                            {/* Highlights */}
                            <ul className='space-y-1 mb-4'>
                              {pkg.highlights.slice(0, 3).map((h, i) => (
                                <li key={i} className='flex items-center gap-2 text-xs'
                                  style={{ color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                                  <span className='w-1.5 h-1.5 rounded-full shrink-0' style={{ background: tc.color }} />
                                  {h}
                                </li>
                              ))}
                              {pkg.highlights.length > 3 && (
                                <li className='text-xs' style={{ color: 'hsl(150,8%,60%)', fontFamily: 'Inter, sans-serif' }}>
                                  +{pkg.highlights.length - 3} more
                                </li>
                              )}
                            </ul>

                            {/* Expand items toggle */}
                            <button
                              type='button'
                              onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                              className='w-full flex items-center justify-between text-xs font-semibold py-2 px-3 rounded-xl mb-3 transition-colors'
                              style={{ background: tc.bg, color: tc.color, fontFamily: 'Inter, sans-serif' }}>
                              <span>{pkg.itemCount} items included</span>
                              {isExpanded ? <ChevronDown className='w-3.5 h-3.5' /> : <ChevronRight className='w-3.5 h-3.5' />}
                            </button>

                            {/* Expanded items list */}
                            {isExpanded && (
                              <div className='mb-3 rounded-xl border overflow-hidden' style={{ borderColor: tc.border }}>
                                {pkg.items.map((item, i) => (
                                  <div key={item.id}
                                    className='flex items-center justify-between px-3 py-2 text-xs'
                                    style={{
                                      background: i % 2 === 0 ? tc.bg : 'white',
                                      borderBottom: i < pkg.items.length - 1 ? `1px solid ${tc.border}` : 'none',
                                      fontFamily: 'Inter, sans-serif',
                                    }}>
                                    <div className='flex items-center gap-2 min-w-0'>
                                      <span className={`shrink-0 w-1.5 h-1.5 rounded-full`}
                                        style={{ background: item.isCore ? tc.color : 'hsl(150,10%,70%)' }} />
                                      <span className='truncate font-medium' style={{ color: 'hsl(155,42%,18%)' }}>{item.name}</span>
                                      {!item.isCore && <span style={{ color: 'hsl(150,8%,60%)' }}>opt</span>}
                                    </div>
                                    <span className='shrink-0 ml-2 font-semibold' style={{ color: tc.color }}>${item.price}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className='flex gap-2'>
                              <Button type='button' variant='outline' className='flex-1 rounded-xl text-xs font-semibold gap-1'
                                style={{ borderColor: tc.border, color: tc.color, fontFamily: 'Inter, sans-serif' }}
                                onClick={() => openPkgEdit(pkg)}>
                                <Pencil className='w-3 h-3' />Edit
                              </Button>
                              {pkg.isActive
                                ? <Button type='button' className='flex-1 rounded-xl text-xs font-semibold'
                                    style={{ background: 'hsl(0,65%,50%)', fontFamily: 'Inter, sans-serif' }}
                                    onClick={() => void togglePackageActive(pkg.id, false)}>Deactivate</Button>
                                : <Button type='button' className='flex-1 rounded-xl text-xs font-semibold'
                                    style={{ background: `linear-gradient(135deg, ${tc.color}, ${tc.color}cc)`, fontFamily: 'Inter, sans-serif' }}
                                    onClick={() => void togglePackageActive(pkg.id, true)}>Activate</Button>
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Customers ── */}
        {adminTab === 'customers' && (
          <div className='space-y-6'>
            {sectionHeader('Customer List', `${(customers ?? []).length} registered customer${(customers ?? []).length !== 1 ? 's' : ''}`)}
            {searchBar(customerSearch, setCustomerSearch, 'Search by name or email…')}
            {tableCard(
              <>
                <TableHeader>
                  <TableRow style={{ background: 'hsl(150,15%,97%)' }}>
                    {['Name', 'Email', 'Phone', 'Orders', 'Events', 'Joined'].map(h => (
                      <TableHead key={h} className='text-xs uppercase tracking-widest font-bold' style={{ color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.customers && (
                    <TableRow>
                      <TableCell colSpan={6} className='py-10 text-center'>
                        <span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                          <Spinner className='w-4 h-4' />Loading customers…
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading.customers && (customers?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='py-10 text-center text-sm' style={{ color: 'hsl(150,10%,52%)' }}>
                        No customers yet
                      </TableCell>
                    </TableRow>
                  )}
                  {(customers ?? []).filter(c => {
                    const q = customerSearch.toLowerCase();
                    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
                  }).map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className='flex items-center gap-2.5'>
                          <div className='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0'
                            style={{ background: 'hsl(155,25%,93%)', color: 'hsl(155,42%,22%)' }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className='font-semibold text-sm' style={{ color: 'hsl(155,45%,13%)' }}>{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5 text-sm' style={{ color: 'hsl(150,10%,47%)', fontFamily: 'Inter, sans-serif' }}>
                          <Mail className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,52%)' }} />
                          {c.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.phone ? (
                          <div className='flex items-center gap-1.5 text-sm' style={{ color: 'hsl(150,10%,47%)', fontFamily: 'Inter, sans-serif' }}>
                            <Phone className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,52%)' }} />
                            {c.phone}
                          </div>
                        ) : (
                          <span className='text-sm' style={{ color: 'hsl(150,10%,70%)' }}>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge style={{ background: 'hsl(43,74%,95%)', color: 'hsl(38,80%,30%)', border: '1px solid hsl(43,60%,80%)' }}>
                          {c.orderCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge style={{ background: 'hsl(155,30%,94%)', color: 'hsl(155,42%,22%)', border: '1px solid hsl(155,25%,78%)' }}>
                          {c.eventCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1.5 text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                          <Calendar className='w-3.5 h-3.5 shrink-0' style={{ color: 'hsl(155,22%,52%)' }} />
                          {formatDate(c.joinedAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </>
            )}
          </div>
        )}

        {/* ── Notifications ── */}
        {adminTab === 'notifications' && (
          <div className='space-y-6'>
            {sectionHeader('Send Notifications', 'Broadcast updates to customer segments')}

            {/* Two-column layout */}
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 items-start'>

              {/* LEFT — Compose card */}
              <div className='bg-white rounded-2xl border overflow-hidden animate-fade-in' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(155,38%,27%))' }} />
                <div className='p-6'>
                  <div className='flex items-center gap-3 mb-5'>
                    <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'rgba(180,130,40,0.1)' }}>
                      <Bell className='w-4 h-4' style={{ color: 'hsl(43,60%,35%)' }} />
                    </div>
                    <div>
                      <h3 className='font-serif text-lg font-bold leading-tight' style={{ color: 'hsl(155,45%,13%)' }}>Compose Message</h3>
                      <p className='text-xs mt-0.5' style={{ color: 'hsl(155,22%,52%)', fontFamily: 'Inter, sans-serif' }}>Send a broadcast to your customers</p>
                    </div>
                  </div>

                  <form className='space-y-4' onSubmit={e => { e.preventDefault(); void submitNotification(); }}>
                    <div>
                      <label className='block text-xs uppercase tracking-widest font-semibold mb-2' style={labelStyle}>Recipient Type</label>
                      <select value={notificationForm.recipientType}
                        onChange={e => setNotificationForm(s => ({ ...s, recipientType: e.target.value }))}
                        disabled={loading.notification}
                        className='h-11 w-full rounded-xl border-2 px-3 text-sm'
                        style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif', color: 'hsl(155,22%,38%)' }}>
                        <option>All Customers</option>
                        <option>Pending Orders</option>
                        <option>Birthday Events</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-xs uppercase tracking-widest font-semibold mb-2' style={labelStyle}>Message Title</label>
                      <Input type='text' placeholder='Notification title…' value={notificationForm.title}
                        onChange={e => setNotificationForm(s => ({ ...s, title: e.target.value }))}
                        disabled={loading.notification} className={inputClass} style={inputStyle} />
                    </div>

                    <div>
                      <label className='block text-xs uppercase tracking-widest font-semibold mb-2' style={labelStyle}>Message Content</label>
                      <Textarea placeholder='Write your notification message…' rows={6} value={notificationForm.content}
                        onChange={e => setNotificationForm(s => ({ ...s, content: e.target.value }))}
                        disabled={loading.notification}
                        className='rounded-xl border-2 resize-none focus:border-green-700 transition-colors'
                        style={inputStyle} />
                    </div>

                    <div className='flex gap-3 pt-1'>
                      <Button type='submit' size='lg' className='flex-1 rounded-xl font-semibold gap-2 transition-all hover:scale-[1.02]'
                        disabled={loading.notification || !notificationForm.title.trim() || !notificationForm.content.trim()}
                        style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                        {loading.notification && <Spinner className='w-4 h-4' />}
                        {loading.notification ? 'Sending…' : 'Send Notification'}
                      </Button>
                      <Button type='button' size='lg' variant='outline' className='flex-1 rounded-xl font-semibold transition-all hover:scale-[1.02]'
                        disabled={loading.notification}
                        style={{ borderColor: 'hsl(150,12%,82%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}
                        onClick={() => setNotificationForm({ recipientType: 'All Customers', title: '', content: '' })}>
                        Clear
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* RIGHT — Broadcast history */}
              <div className='bg-white rounded-2xl border overflow-hidden animate-fade-in' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                <div className='h-1' style={{ background: 'linear-gradient(90deg, hsl(155,38%,27%), hsl(43,74%,49%))' }} />
                <div className='p-6 pb-4'>
                  <div className='flex items-center justify-between mb-5'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-xl flex items-center justify-center' style={{ background: 'hsl(155,38%,95%)' }}>
                        <RefreshCw className='w-4 h-4' style={{ color: 'hsl(155,38%,30%)' }} />
                      </div>
                      <div>
                        <h3 className='font-serif text-lg font-bold leading-tight' style={{ color: 'hsl(155,45%,13%)' }}>Sent History</h3>
                        <p className='text-xs mt-0.5' style={{ color: 'hsl(155,22%,52%)', fontFamily: 'Inter, sans-serif' }}>
                          {broadcasts ? `${broadcasts.length} broadcast${broadcasts.length !== 1 ? 's' : ''} sent` : 'All past broadcasts'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => void loadBroadcasts()}
                      disabled={loading.broadcasts}
                      className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50'
                      style={{ color: 'hsl(155,30%,35%)', borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading.broadcasts ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {/* history list */}
                  <div className='space-y-0 rounded-xl border overflow-hidden' style={{ borderColor: 'hsl(150,12%,90%)' }}>
                    {loading.broadcasts && !broadcasts ? (
                      <div className='flex items-center justify-center py-14'>
                        <Spinner className='w-5 h-5' />
                      </div>
                    ) : !broadcasts || broadcasts.length === 0 ? (
                      <div className='py-14 text-center' style={{ background: 'hsl(150,20%,98%)' }}>
                        <div className='w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3' style={{ background: 'hsl(150,20%,93%)' }}>
                          <Bell className='w-5 h-5' style={{ color: 'hsl(155,22%,55%)' }} />
                        </div>
                        <p className='text-sm font-semibold' style={{ color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>No notifications sent yet</p>
                        <p className='text-xs mt-1' style={{ color: 'hsl(155,15%,62%)', fontFamily: 'Inter, sans-serif' }}>Messages you send will appear here</p>
                      </div>
                    ) : (
                      <div className='divide-y max-h-[480px] overflow-y-auto' style={{ borderColor: 'hsl(150,12%,92%)' }}>
                        {broadcasts.map((b, idx) => (
                          <div key={b.id} className='px-4 py-4 transition-colors hover:bg-gray-50' style={{ background: idx === 0 ? 'hsl(150,30%,98.5%)' : '#fff' }}>
                            <div className='flex items-start justify-between gap-3'>
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-semibold truncate' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{b.title}</p>
                                <p className='text-xs mt-1 leading-relaxed line-clamp-2' style={{ color: 'hsl(155,22%,48%)', fontFamily: 'Inter, sans-serif' }}>{b.content}</p>
                                <div className='flex items-center gap-2 mt-2'>
                                  <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full'
                                    style={{ background: 'hsl(155,38%,93%)', color: 'hsl(155,38%,24%)' }}>
                                    <Users className='w-3 h-3' />
                                    {b.recipientCount} {b.recipientCount === 1 ? 'customer' : 'customers'}
                                  </span>
                                </div>
                              </div>
                              <div className='text-right shrink-0'>
                                <p className='text-xs font-medium whitespace-nowrap' style={{ color: 'hsl(155,22%,52%)', fontFamily: 'Inter, sans-serif' }}>
                                  {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className='text-xs mt-0.5 whitespace-nowrap' style={{ color: 'hsl(155,15%,65%)', fontFamily: 'Inter, sans-serif' }}>
                                  {new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Operations ── */}
        {adminTab === 'operations' && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const EVENT_TYPE_LABEL: Record<string, string> = {
            BIRTHDAY: 'Birthday', WEDDING: 'Wedding', PROPOSAL: 'Proposal',
            BABY_SHOWER: 'Baby Shower', KIDS_PARTY: "Kids' Party",
          };
          const CATEGORY_ICON: Record<string, string> = {
            CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁',
            PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️',
          };

          async function toggleStep(_eventId: string, step: { id: string; isCompleted: boolean }) {
            try {
              if (step.isCompleted) {
                await adminOperationsAPI.uncompleteStep(step.id);
              } else {
                await adminOperationsAPI.completeStep(step.id);
              }
              const res = await adminOperationsAPI.list();
              setOperations(res.data.events);
            } catch {
              toast({ variant: 'destructive', title: 'Failed to update step' });
            }
          }

          function toggleOrderItems(eventId: string) {
            setExpandedOrderItems(prev => {
              const next = new Set(prev);
              if (next.has(eventId)) { next.delete(eventId); } else { next.add(eventId); }
              return next;
            });
          }

          const ops = operations ?? [];
          const upcoming = ops.filter(e => new Date(e.date) >= today);
          const past     = ops.filter(e => new Date(e.date) < today);

          return (
            <div className='space-y-6'>
              {sectionHeader('Operations', 'Manage company-side task completion for all events')}

              {operations === null ? (
                <div className='flex items-center justify-center py-24'><Spinner className='size-6' /></div>
              ) : ops.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-20 gap-3'>
                  <Wrench className='w-10 h-10' style={{ color: '#cbd5e1' }} />
                  <p className='text-sm' style={{ color: '#64748b' }}>No events with management tasks yet.</p>
                </div>
              ) : (
                <div className='space-y-8'>
                  {[{ label: 'Upcoming Events', list: upcoming }, { label: 'Past Events', list: past }].map(group => group.list.length > 0 && (
                    <div key={group.label}>
                      <h3 className='text-xs font-bold uppercase tracking-widest mb-3' style={{ color: '#64748b' }}>{group.label}</h3>
                      <div className='space-y-4'>
                        {group.list.map(event => {
                          const total = event.managementSteps.length;
                          const done  = event.managementSteps.filter(s => s.isCompleted).length;
                          const daysUntil = Math.ceil((new Date(event.date).getTime() - today.getTime()) / 86400000);
                          const itemsExpanded = expandedOrderItems.has(event.id);
                          const totalOrderValue = event.orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                          return (
                            <div key={event.id} className='rounded-2xl overflow-hidden'
                              style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                              <div className='h-1' style={{ background: done === total ? '#22c55e' : 'hsl(43,74%,49%)' }} />
                              <div className='p-5'>

                                {/* ── Event header ── */}
                                <div className='flex items-start justify-between gap-4 mb-3'>
                                  <div className='flex-1 min-w-0'>
                                    <div className='flex items-center gap-2 flex-wrap mb-0.5'>
                                      <p className='font-bold text-base' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{event.name}</p>
                                      <span className='text-xs font-semibold px-2 py-0.5 rounded-full shrink-0'
                                        style={{ background: 'hsl(43,74%,96%)', color: 'hsl(43,60%,35%)', border: '1px solid hsl(43,60%,82%)', fontFamily: 'Inter, sans-serif' }}>
                                        {EVENT_TYPE_LABEL[event.type] ?? event.type}
                                      </span>
                                    </div>
                                    <p className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                                      {event.customer.name} · {event.customer.email}
                                    </p>
                                    <p className='text-xs mt-0.5' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                                      {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                      {event.time && ` · ${event.time}`}
                                      {daysUntil > 0 ? ` · ${daysUntil}d away` : daysUntil === 0 ? ' · Today!' : ' · Past'}
                                    </p>
                                  </div>
                                  <div className='text-right shrink-0'>
                                    <span className='text-xs font-bold px-2.5 py-1 rounded-full'
                                      style={{
                                        background: done === total ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.12)',
                                        color:      done === total ? '#16a34a' : 'hsl(43,74%,40%)',
                                        fontFamily: 'Inter, sans-serif',
                                      }}>
                                      {done}/{total} done
                                    </span>
                                  </div>
                                </div>

                                {/* ── Event details grid ── */}
                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 rounded-xl p-3'
                                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  {event.guestCount != null && (
                                    <div className='flex items-center gap-1.5'>
                                      <Users className='w-3.5 h-3.5 shrink-0' style={{ color: '#64748b' }} />
                                      <div>
                                        <p className='text-xs' style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Guests</p>
                                        <p className='text-xs font-semibold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{event.guestCount}</p>
                                      </div>
                                    </div>
                                  )}
                                  {event.venue && (
                                    <div className='flex items-center gap-1.5 col-span-2 sm:col-span-1'>
                                      <MapPin className='w-3.5 h-3.5 shrink-0' style={{ color: '#64748b' }} />
                                      <div className='min-w-0'>
                                        <p className='text-xs' style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Venue</p>
                                        <p className='text-xs font-semibold truncate' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{event.venue}</p>
                                      </div>
                                    </div>
                                  )}
                                  {event.colorTheme && (
                                    <div className='flex items-center gap-1.5'>
                                      <span className='w-3.5 h-3.5 shrink-0 text-center text-xs leading-none' style={{ color: '#64748b' }}>🎨</span>
                                      <div>
                                        <p className='text-xs' style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Theme</p>
                                        <p className='text-xs font-semibold' style={{ color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>{event.colorTheme}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* ── Booked items (collapsible) ── */}
                                {event.orderItems.length > 0 && (
                                  <div className='mb-3'>
                                    <button
                                      type='button'
                                      onClick={() => toggleOrderItems(event.id)}
                                      className='w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors'
                                      style={{
                                        background: itemsExpanded ? 'hsl(43,74%,96%)' : '#f8fafc',
                                        color: 'hsl(43,60%,32%)',
                                        border: '1px solid hsl(43,60%,85%)',
                                        fontFamily: 'Inter, sans-serif',
                                      }}>
                                      <span>📦 {event.orderItems.length} booked item{event.orderItems.length !== 1 ? 's' : ''} · ${totalOrderValue.toLocaleString()}</span>
                                      {itemsExpanded ? <ChevronDown className='w-3.5 h-3.5' /> : <ChevronRight className='w-3.5 h-3.5' />}
                                    </button>
                                    {itemsExpanded && (
                                      <div className='mt-1 rounded-xl border overflow-hidden' style={{ borderColor: 'hsl(43,60%,85%)' }}>
                                        {event.orderItems.map((item: AdminOperationOrderItem, idx: number) => (
                                          <div key={idx}
                                            className='flex items-center gap-2.5 px-3 py-2 text-xs'
                                            style={{
                                              background: idx % 2 === 0 ? 'hsl(43,74%,98%)' : 'white',
                                              borderBottom: idx < event.orderItems.length - 1 ? '1px solid hsl(43,60%,90%)' : 'none',
                                              fontFamily: 'Inter, sans-serif',
                                            }}>
                                            <span className='text-base w-5 text-center shrink-0'>{CATEGORY_ICON[item.categoryName] ?? '🛍️'}</span>
                                            <div className='flex-1 min-w-0'>
                                              <p className='font-semibold truncate' style={{ color: '#0f172a' }}>{item.productName}</p>
                                              {item.venueAddress && (
                                                <p className='text-xs mt-0.5 flex items-center gap-1' style={{ color: '#64748b' }}>
                                                  <MapPin className='w-2.5 h-2.5 shrink-0' />{item.venueAddress}
                                                </p>
                                              )}
                                            </div>
                                            <div className='text-right shrink-0'>
                                              <p style={{ color: 'hsl(43,60%,32%)' }}>
                                                {item.quantity > 1 && <span className='text-gray-400'>×{item.quantity} </span>}
                                                <span className='font-bold'>${(item.unitPrice * item.quantity).toLocaleString()}</span>
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ── Progress bar ── */}
                                <div className='h-1.5 rounded-full mb-4' style={{ background: '#f1f5f9' }}>
                                  <div className='h-full rounded-full transition-all duration-500'
                                    style={{ width: `${total > 0 ? Math.round(done / total * 100) : 0}%`, background: done === total ? '#22c55e' : 'hsl(43,74%,49%)' }} />
                                </div>

                                {/* ── Management steps ── */}
                                <div className='space-y-2'>
                                  {event.managementSteps.map(step => {
                                    const due = step.timeOfDay ? null : new Date(new Date(event.date).getTime() - step.weeksBefore * 7 * 24 * 60 * 60 * 1000);
                                    return (
                                      <div key={step.id} className='flex items-start gap-3 py-2 border-b last:border-0' style={{ borderColor: '#f8fafc' }}>
                                        <button
                                          onClick={() => toggleStep(event.id, step)}
                                          className='mt-0.5 shrink-0 hover:scale-110 transition-transform'
                                          title={step.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                        >
                                          {step.isCompleted
                                            ? <CheckCircle2 className='w-5 h-5' style={{ color: '#22c55e' }} />
                                            : <Circle className='w-5 h-5' style={{ color: '#cbd5e1' }} />
                                          }
                                        </button>
                                        <div className='flex-1 min-w-0'>
                                          <p className={`text-sm font-semibold ${step.isCompleted ? 'line-through' : ''}`}
                                            style={{ color: step.isCompleted ? '#94a3b8' : '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                                            {step.title}
                                          </p>
                                          {step.description && (
                                            <p className='text-xs mt-0.5' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>{step.description}</p>
                                          )}
                                          <div className='flex items-center gap-3 mt-1'>
                                            {due ? (
                                              <span className='text-xs' style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
                                                {step.weeksBefore === 0 ? 'Event day' : `${step.weeksBefore}w before`} · {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            ) : step.timeOfDay ? (
                                              <span className='text-xs' style={{ color: 'hsl(43,60%,48%)', fontFamily: 'Inter, sans-serif' }}>
                                                Event day · {step.timeOfDay}
                                              </span>
                                            ) : null}
                                            {step.isCompleted && step.completedAt && (
                                              <span className='text-xs' style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>
                                                ✓ Completed {new Date(step.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Building2 className='w-3.5 h-3.5 shrink-0 mt-1' style={{ color: 'hsl(43,60%,55%)' }} />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* ── Package edit modal ── */}
      {pkgEditModal.open && (() => {
        const CAT_EMOJI: Record<string, string> = { CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁', PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️' };
        const availableProducts = (products ?? []).filter(p => p.isActive && !pkgForm.items.some(i => i.productId === p.id));
        const addProduct = () => {
          const p = (products ?? []).find(x => x.id === pkgAddProductId);
          if (!p) return;
          setPkgForm(f => ({ ...f, items: [...f.items, { productId: p.id, name: p.name, category: p.category, price: Number(p.price), quantity: 1, isCore: true }] }));
          setPkgAddProductId('');
        };
        return (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ background: 'rgba(10,25,15,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className='w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in'>
              <div className='px-6 py-5 flex items-center justify-between relative' style={{ background: 'linear-gradient(135deg, hsl(155,45%,13%), hsl(155,38%,20%))' }}>
                <div className='h-px absolute top-0 left-0 right-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />
                <div className='flex items-center gap-3'>
                  <Pencil className='w-5 h-5' style={{ color: 'hsl(43,74%,60%)' }} />
                  <div>
                    <h2 className='font-serif text-xl font-bold text-white'>Edit Package</h2>
                    <p className='text-xs' style={{ color: 'hsl(155,20%,65%)' }}>
                      {pkgEditModal.pkg.eventType} · {pkgEditModal.pkg.tier}
                    </p>
                  </div>
                </div>
                <button onClick={closePkgEdit} className='text-white/60 hover:text-white transition-colors'><X className='w-5 h-5' /></button>
              </div>

              <div className='p-6 space-y-5 max-h-[78vh] overflow-y-auto'>
                {/* Name */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>Package Name *</label>
                  <Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))}
                    className='h-11 rounded-xl border-2 transition-colors' style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' }}
                    placeholder='e.g. Bronze Birthday Package' />
                </div>

                {/* Description */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>Description</label>
                  <Input value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))}
                    className='h-11 rounded-xl border-2 transition-colors' style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' }}
                    placeholder='Short package description' />
                </div>

                {/* Highlights */}
                <div>
                  <label className='block text-xs uppercase tracking-widest font-semibold mb-1.5' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>
                    Highlights <span className='ml-1 normal-case font-normal' style={{ color: 'hsl(150,8%,58%)' }}>(one per line)</span>
                  </label>
                  <Textarea value={pkgForm.highlights} onChange={e => setPkgForm(f => ({ ...f, highlights: e.target.value }))}
                    rows={3} placeholder={'Catering for up to 30 guests\nProfessional photographer'}
                    className='rounded-xl border-2 resize-none transition-colors' style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif' }} />
                </div>

                {/* Package Items */}
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>
                      Package Items <span className='ml-1 normal-case font-normal' style={{ color: 'hsl(150,8%,58%)' }}>({pkgForm.items.length})</span>
                    </label>
                  </div>

                  {/* Current items */}
                  <div className='rounded-xl border overflow-hidden mb-3' style={{ borderColor: 'hsl(150,12%,88%)' }}>
                    {pkgForm.items.length === 0 ? (
                      <p className='text-xs text-center py-4' style={{ color: 'hsl(150,8%,58%)', fontFamily: 'Inter, sans-serif' }}>No items added yet</p>
                    ) : (
                      pkgForm.items.map((item, idx) => (
                        <div key={item.productId} className='flex items-center gap-2 px-3 py-2.5' style={{ borderBottom: idx < pkgForm.items.length - 1 ? '1px solid hsl(150,12%,92%)' : 'none', background: idx % 2 === 0 ? 'white' : 'hsl(150,12%,99%)' }}>
                          <span className='text-base w-6 text-center shrink-0'>{CAT_EMOJI[item.category] ?? '🎁'}</span>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold truncate' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{item.name}</p>
                            <p className='text-xs' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>${item.price.toLocaleString()}</p>
                          </div>
                          {/* Qty stepper */}
                          <div className='flex items-center gap-1 shrink-0'>
                            <button type='button'
                              onClick={() => setPkgForm(f => ({ ...f, items: f.items.map((i, j) => j === idx ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i) }))}
                              className='w-6 h-6 rounded-lg flex items-center justify-center font-bold transition-colors hover:bg-gray-100'
                              style={{ color: 'hsl(155,38%,27%)', fontSize: '16px', lineHeight: 1 }}>−</button>
                            <span className='w-6 text-center text-sm font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{item.quantity}</span>
                            <button type='button'
                              onClick={() => setPkgForm(f => ({ ...f, items: f.items.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i) }))}
                              className='w-6 h-6 rounded-lg flex items-center justify-center font-bold transition-colors hover:bg-gray-100'
                              style={{ color: 'hsl(155,38%,27%)', fontSize: '16px', lineHeight: 1 }}>+</button>
                          </div>
                          <button type='button'
                            onClick={() => setPkgForm(f => ({ ...f, items: f.items.filter((_, j) => j !== idx) }))}
                            className='w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 shrink-0'
                            style={{ color: 'hsl(0,60%,55%)' }}>
                            <X className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add item */}
                  <div className='flex gap-2'>
                    <select
                      value={pkgAddProductId}
                      onChange={e => setPkgAddProductId(e.target.value)}
                      className='flex-1 h-9 rounded-xl border-2 px-3 text-sm transition-colors'
                      style={{ borderColor: 'hsl(150,12%,88%)', fontFamily: 'Inter, sans-serif', color: pkgAddProductId ? 'hsl(155,45%,13%)' : 'hsl(150,8%,58%)' }}
                    >
                      <option value=''>
                        {loading.products ? 'Loading products…' : availableProducts.length === 0 ? 'All products added' : 'Select a product to add…'}
                      </option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString()}</option>
                      ))}
                    </select>
                    <Button type='button' size='sm' onClick={addProduct} disabled={!pkgAddProductId}
                      className='rounded-xl font-semibold gap-1 shrink-0'
                      style={{ background: 'linear-gradient(135deg, hsl(43,74%,49%), hsl(38,65%,42%))', color: 'hsl(155,45%,10%)', fontFamily: 'Inter, sans-serif' }}>
                      <Plus className='w-3.5 h-3.5' /> Add
                    </Button>
                  </div>
                </div>

                {/* Package Photos */}
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <label className='text-xs uppercase tracking-widest font-semibold' style={{ color: 'hsl(155,30%,32%)', fontFamily: 'Inter, sans-serif' }}>
                      Package Photos <span className='ml-1 normal-case font-normal' style={{ color: 'hsl(150,8%,58%)' }}>({pkgPhotos.length})</span>
                    </label>
                    <button
                      type='button'
                      onClick={() => pkgPhotoInputRef.current?.click()}
                      disabled={pkgPhotoUploading}
                      className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50'
                      style={{ background: 'hsl(155,30%,95%)', color: 'hsl(155,38%,27%)', border: '1px solid hsl(155,25%,78%)', fontFamily: 'Inter, sans-serif' }}>
                      {pkgPhotoUploading ? (
                        <><span className='w-3 h-3 border-2 rounded-full animate-spin' style={{ borderColor: 'hsl(155,30%,75%)', borderTopColor: 'hsl(155,38%,27%)' }} />Uploading…</>
                      ) : (
                        <><Upload className='w-3 h-3' />Add Photo</>
                      )}
                    </button>
                    <input
                      ref={pkgPhotoInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) void handlePkgPhotoUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {pkgPhotos.length === 0 ? (
                    <button
                      type='button'
                      onClick={() => pkgPhotoInputRef.current?.click()}
                      disabled={pkgPhotoUploading}
                      className='w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 transition-colors hover:border-green-600/50 disabled:opacity-50'
                      style={{ borderColor: 'hsl(150,12%,82%)', background: 'hsl(150,15%,98%)' }}>
                      <Upload className='w-5 h-5' style={{ color: 'hsl(155,20%,52%)' }} />
                      <p className='text-xs font-semibold' style={{ color: 'hsl(155,30%,35%)', fontFamily: 'Inter, sans-serif' }}>Upload catalog photos</p>
                      <p className='text-xs' style={{ color: 'hsl(150,8%,58%)', fontFamily: 'Inter, sans-serif' }}>Help customers visualize the package</p>
                    </button>
                  ) : (
                    <div className='grid grid-cols-3 gap-2'>
                      {pkgPhotos.map(photo => (
                        <div key={photo.id} className='relative group rounded-xl overflow-hidden border' style={{ aspectRatio: '4/3', borderColor: 'hsl(150,12%,88%)' }}>
                          <img src={photo.url} alt={photo.caption ?? 'Package photo'} className='w-full h-full object-cover' />
                          <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                            style={{ background: 'rgba(0,0,0,0.45)' }}>
                            <button
                              type='button'
                              onClick={() => void deletePkgPhoto(photo.id)}
                              className='w-8 h-8 rounded-full flex items-center justify-center transition-colors'
                              style={{ background: 'rgba(200,40,40,0.85)', color: 'white' }}>
                              <X className='w-3.5 h-3.5' />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type='button'
                        onClick={() => pkgPhotoInputRef.current?.click()}
                        disabled={pkgPhotoUploading}
                        className='rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-green-600/50 disabled:opacity-50'
                        style={{ aspectRatio: '4/3', borderColor: 'hsl(150,12%,82%)', background: 'hsl(150,15%,98%)' }}>
                        <Plus className='w-4 h-4' style={{ color: 'hsl(155,20%,52%)' }} />
                        <span className='text-xs' style={{ color: 'hsl(155,20%,52%)', fontFamily: 'Inter, sans-serif' }}>Add more</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className='flex gap-3 pt-1'>
                  <Button type='button' variant='outline' onClick={closePkgEdit} disabled={loading.pkgSave}
                    className='flex-1 rounded-xl font-semibold'
                    style={{ borderColor: 'hsl(150,12%,85%)', color: 'hsl(155,22%,38%)', fontFamily: 'Inter, sans-serif' }}>
                    Cancel
                  </Button>
                  <Button type='button' onClick={() => void savePkgEdit()} disabled={loading.pkgSave}
                    className='flex-1 rounded-xl font-semibold gap-2'
                    style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                    {loading.pkgSave && <Spinner className='w-4 h-4' />}
                    {loading.pkgSave ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Order detail modal ── */}
      {orderDetailModal.open && (() => {
        const od = orderDetailModal.order;
        const STATUS_CONFIG = Object.fromEntries(
          Object.entries(ORDER_STATUS_COLOR).map(([k, v]) => [k, { label: orderStatusLabel(k), ...v }])
        );
        const CATEGORY_ICON: Record<string, string> = { CAKES: '🎂', DECORATIONS: '🎊', FOOD: '🍽️', GIFTS: '🎁', PHOTOGRAPHY: '📸', ENTERTAINMENT: '🎵', VENUE: '🏛️' };
        return (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4' style={{ background: 'rgba(10,25,15,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className='w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-fade-in'>
              <div className='px-6 py-5 flex items-center justify-between relative' style={{ background: 'linear-gradient(135deg, hsl(155,45%,13%), hsl(155,38%,20%))' }}>
                <div className='h-px absolute top-0 left-0 right-0' style={{ background: 'linear-gradient(90deg, hsl(43,74%,49%), hsl(43,55%,65%), hsl(43,74%,49%))' }} />
                <div className='flex items-center gap-3'>
                  <Eye className='w-5 h-5' style={{ color: 'hsl(43,74%,60%)' }} />
                  <h2 className='font-serif text-xl font-bold text-white'>
                    {od ? `Order #${od.orderNumber}` : 'Order Details'}
                  </h2>
                </div>
                <button onClick={closeOrderDetail} className='text-white/60 hover:text-white transition-colors'><X className='w-5 h-5' /></button>
              </div>

              <div className='p-6 max-h-[75vh] overflow-y-auto'>
                {!od ? (
                  <div className='py-10 text-center'><span className='inline-flex items-center gap-2 text-sm' style={{ color: 'hsl(150,10%,52%)' }}><Spinner className='w-4 h-4' />Loading…</span></div>
                ) : (
                  <div className='space-y-5'>
                    {/* Meta */}
                    <div className='rounded-xl p-4 space-y-2' style={{ background: 'hsl(150,18%,97%)', border: '1px solid hsl(150,12%,88%)' }}>
                      {[
                        { label: 'Customer',   value: od.customer },
                        { label: 'Order Date', value: new Date(od.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                        ...(od.event ? [{ label: 'Event', value: `${od.event.name} (${od.event.type})` }] : []),
                        ...(od.event?.date ? [{ label: 'Event Date', value: new Date(od.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }] : []),
                        ...(od.event?.time ? [{ label: 'Event Time', value: od.event.time }] : []),
                        ...(od.event?.venue ? [{ label: 'Venue', value: `📍 ${od.event.venue}` }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className='flex justify-between gap-3 text-sm'>
                          <span style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
                          <span className='font-semibold text-right truncate' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{value}</span>
                        </div>
                      ))}
                      {od.customerEmail && (
                        <div className='flex justify-between gap-3 text-sm items-center pt-1'>
                          <span style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Email</span>
                          <a
                            href={`mailto:${od.customerEmail}?subject=Regarding Order %23${od.orderNumber}`}
                            className='font-semibold text-right truncate underline underline-offset-2 transition-colors hover:opacity-75'
                            style={{ color: 'hsl(155,42%,22%)', fontFamily: 'Inter, sans-serif' }}
                          >
                            {od.customerEmail}
                          </a>
                        </div>
                      )}
                      {od.deliveryAddress && (
                        <div className='flex justify-between gap-3 text-sm items-start pt-1'>
                          <span className='shrink-0' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Delivery Address</span>
                          <span className='font-semibold text-right' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{od.deliveryAddress}</span>
                        </div>
                      )}
                      {od.event?.guestCount != null && (
                        <div className='flex justify-between gap-3 text-sm items-center pt-1'>
                          <span style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Guests</span>
                          <span className='font-semibold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>👥 {od.event.guestCount}</span>
                        </div>
                      )}
                      {od.event?.colorTheme && (
                        <div className='flex justify-between gap-3 text-sm items-center pt-1'>
                          <span style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Colour Theme</span>
                          <span className='font-semibold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>🎨 {od.event.colorTheme}</span>
                        </div>
                      )}
                      <div className='flex justify-between gap-3 text-sm items-center'>
                        <span style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Status</span>
                        {(() => { const s = STATUS_CONFIG[od.status] ?? STATUS_CONFIG.PENDING_PAYMENT; return (
                          <span className='text-xs font-bold px-2 py-0.5 rounded-full' style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        ); })()}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <p className='text-xs uppercase tracking-widest font-bold mb-3' style={{ color: 'hsl(155,25%,42%)', fontFamily: 'Inter, sans-serif' }}>Items</p>
                      <div className='space-y-2'>
                        {od.items.map(item => (
                          <div key={item.id} className='flex items-center gap-3 rounded-xl px-3 py-2.5'
                            style={{ background: 'hsl(150,15%,98%)', border: '1px solid hsl(150,12%,90%)' }}>
                            <span className='text-lg w-6 text-center shrink-0'>{CATEGORY_ICON[item.categoryName] ?? '🛍️'}</span>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-semibold truncate' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>{item.productName}</p>
                              <p className='text-xs' style={{ color: 'hsl(150,8%,52%)', fontFamily: 'Inter, sans-serif' }}>Qty {item.quantity} · ${item.unitPrice.toFixed(2)} each</p>
                            </div>
                            <span className='text-sm font-bold shrink-0' style={{ color: 'hsl(43,60%,30%)', fontFamily: 'Inter, sans-serif' }}>
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    {(() => {
                      const amt = toNumber(od.totalAmount);
                      return (
                        <div className='rounded-xl p-4 space-y-2' style={{ background: 'hsl(150,18%,97%)' }}>
                          <div className='flex justify-between text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                            <span>Subtotal</span><span>${(amt / 1.1).toFixed(2)}</span>
                          </div>
                          <div className='flex justify-between text-sm' style={{ color: 'hsl(150,10%,52%)', fontFamily: 'Inter, sans-serif' }}>
                            <span>Tax (10%)</span><span>${(amt - amt / 1.1).toFixed(2)}</span>
                          </div>
                          <div className='h-px' style={{ background: 'hsl(150,12%,88%)' }} />
                          <div className='flex justify-between items-center'>
                            <span className='font-bold' style={{ color: 'hsl(155,45%,13%)', fontFamily: 'Inter, sans-serif' }}>Total</span>
                            <span className='font-serif text-xl font-bold' style={{ color: 'hsl(43,60%,30%)' }}>${amt.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <Button type='button' onClick={closeOrderDetail}
                      className='w-full rounded-xl font-semibold'
                      style={{ background: 'linear-gradient(135deg, hsl(155,42%,20%), hsl(155,33%,32%))', fontFamily: 'Inter, sans-serif' }}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
