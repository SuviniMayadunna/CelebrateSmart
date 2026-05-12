import { AppScreen, User } from '@/App';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { adminAPI, type AdminOrder, type AdminProduct, type AdminTemplate, type OrderStatus } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (screen: AppScreen) => void;
  adminTab: string;
  onAdminTabChange: (tab: string) => void;
}

export function AdminDashboard({ adminTab }: AdminDashboardProps) {
  const [stats, setStats] = useState<{
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
  } | null>(null);

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [templates, setTemplates] = useState<AdminTemplate[] | null>(null);

  const [loading, setLoading] = useState({
    stats: false,
    orders: false,
    products: false,
    templates: false,
    notification: false,
  });

  const [notificationForm, setNotificationForm] = useState({
    recipientType: 'All Customers',
    title: '',
    content: '',
  });

  const [loadError, setLoadError] = useState<string | null>(null);

  const orderStatusBadgeVariant = (
    status: string
  ): ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'outline';
      case 'PROCESSING':
        return 'secondary';
      case 'COMPLETED':
        return 'default';
      case 'CANCELED':
        return 'destructive';
      case 'PAID':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const orderStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Pending';
      case 'PAID':
        return 'Paid';
      case 'PROCESSING':
        return 'Processing';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELED':
        return 'Canceled';
      default:
        return status;
    }
  };

  const formatDate = (dateIso: string) => {
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return dateIso;
    return d.toISOString().slice(0, 10);
  };

  const toNumber = (value: number | string) => {
    if (typeof value === 'number') return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totals = useMemo(() => {
    if (!stats) return null;
    return {
      ...stats,
      totalRevenue: toNumber(stats.totalRevenue),
    };
  }, [stats]);

  const loadStatsAndOrders = async () => {
    setLoadError(null);
    setLoading((s) => ({ ...s, stats: true, orders: true }));
    try {
      const [statsRes, ordersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.listOrders(20),
      ]);
      setStats({
        totalCustomers: statsRes.data.totalCustomers,
        totalOrders: statsRes.data.totalOrders,
        totalRevenue: toNumber(statsRes.data.totalRevenue),
        pendingOrders: statsRes.data.pendingOrders,
      });
      setOrders(ordersRes.data.orders);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading((s) => ({ ...s, stats: false, orders: false }));
    }
  };

  const loadProducts = async () => {
    setLoadError(null);
    setLoading((s) => ({ ...s, products: true }));
    try {
      const res = await adminAPI.listProducts(200);
      setProducts(res.data.products);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading((s) => ({ ...s, products: false }));
    }
  };

  const loadTemplates = async () => {
    setLoadError(null);
    setLoading((s) => ({ ...s, templates: true }));
    try {
      const res = await adminAPI.listTemplates(200);
      setTemplates(res.data.templates);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading((s) => ({ ...s, templates: false }));
    }
  };

  useEffect(() => {
    // Initial load
    if (!stats || !orders) {
      void loadStatsAndOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminTab === 'products' && !products && !loading.products) {
      void loadProducts();
    }
    if (adminTab === 'templates' && !templates && !loading.templates) {
      void loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await adminAPI.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        (prev ?? []).map((o) => (o.id === orderId ? res.data.order : o))
      );
      toast({ title: 'Order updated', description: `Status set to ${orderStatusLabel(status)}` });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update order',
      });
    }
  };

  const setProductActive = async (productId: string, isActive: boolean) => {
    try {
      const res = await adminAPI.setProductActive(productId, isActive);
      setProducts((prev) =>
        (prev ?? []).map((p) => (p.id === productId ? res.data.product : p))
      );
      toast({
        title: 'Product updated',
        description: isActive ? 'Product activated' : 'Product deactivated',
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update product',
      });
    }
  };

  const setTemplateActive = async (templateId: string, isActive: boolean) => {
    try {
      const res = await adminAPI.setTemplateActive(templateId, isActive);
      setTemplates((prev) =>
        (prev ?? []).map((t) => (t.id === templateId ? res.data.template : t))
      );
      toast({
        title: 'Template updated',
        description: isActive ? 'Template activated' : 'Template deactivated',
      });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update template',
      });
    }
  };

  const submitNotification = async () => {
    setLoading((s) => ({ ...s, notification: true }));
    try {
      await adminAPI.sendNotification(notificationForm);
      toast({ title: 'Notification sent', description: 'Your message was queued.' });
      setNotificationForm((f) => ({ ...f, title: '', content: '' }));
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Send failed',
        description: err instanceof Error ? err.message : 'Could not send notification',
      });
    } finally {
      setLoading((s) => ({ ...s, notification: false }));
    }
  };

  return (
    <div className='min-h-screen'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        {/* Overview Tab */}
        {adminTab === 'overview' && (
          <div className='space-y-8'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight'>Dashboard Overview</h2>
                <p className='text-sm text-muted-foreground'>High-level performance and recent activity</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[
                { label: 'Total Customers', value: totals?.totalCustomers ?? '—' },
                { label: 'Total Orders', value: totals?.totalOrders ?? '—' },
                { label: 'Total Revenue', value: totals ? `$${totals.totalRevenue}` : '—' },
                { label: 'Pending Orders', value: totals?.pendingOrders ?? '—' },
              ].map((stat) => (
                <Card key={stat.label} className='shadow-sm'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-3xl font-bold tracking-tight'>
                      {loading.stats ? <span className='inline-flex items-center gap-2 text-base'><Spinner className='size-4' /> Loading</span> : stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loadError && (
              <Card className='border-destructive/30'>
                <CardHeader>
                  <CardTitle className='text-base text-destructive'>Could not load admin data</CardTitle>
                </CardHeader>
                <CardContent className='flex items-center justify-between gap-3'>
                  <p className='text-sm text-muted-foreground'>{loadError}</p>
                  <Button type='button' variant='secondary' onClick={() => void loadStatsAndOrders()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className='text-xl'>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading.orders && (
                      <TableRow>
                        <TableCell colSpan={5} className='py-10 text-center text-muted-foreground'>
                          <span className='inline-flex items-center gap-2'>
                            <Spinner className='size-4' /> Loading orders…
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading.orders && (orders?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className='py-10 text-center text-muted-foreground'>
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                    {(orders ?? []).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className='font-mono text-xs'>{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>${toNumber(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={orderStatusBadgeVariant(order.status)}>
                            {orderStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>{formatDate(order.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {adminTab === 'products' && (
          <div className='space-y-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight'>Product Management</h2>
                <p className='text-sm text-muted-foreground'>Manage catalog items and inventory</p>
              </div>
              <Button>
                + Add Product
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-xl'>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading.products && (
                      <TableRow>
                        <TableCell colSpan={5} className='py-10 text-center text-muted-foreground'>
                          <span className='inline-flex items-center gap-2'>
                            <Spinner className='size-4' /> Loading products…
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading.products && (products?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className='py-10 text-center text-muted-foreground'>
                          No products found
                        </TableCell>
                      </TableRow>
                    )}
                    {(products ?? []).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className='font-semibold'>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${toNumber(product.price)}</TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'secondary' : 'outline'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Button type='button' variant='link' className='h-auto px-0 text-xs' disabled>
                              Edit
                            </Button>
                            {product.isActive ? (
                              <Button
                                type='button'
                                variant='link'
                                className='h-auto px-0 text-xs text-destructive'
                                onClick={() => void setProductActive(product.id, false)}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                type='button'
                                variant='link'
                                className='h-auto px-0 text-xs'
                                onClick={() => void setProductActive(product.id, true)}
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {adminTab === 'orders' && (
          <div className='space-y-8'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight'>Order Management</h2>
              <p className='text-sm text-muted-foreground'>Track and update order statuses</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className='text-xl'>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading.orders && (
                      <TableRow>
                        <TableCell colSpan={6} className='py-10 text-center text-muted-foreground'>
                          <span className='inline-flex items-center gap-2'>
                            <Spinner className='size-4' /> Loading orders…
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading.orders && (orders?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className='py-10 text-center text-muted-foreground'>
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                    {(orders ?? []).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className='font-mono text-xs'>{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell className='font-semibold'>${toNumber(order.totalAmount)}</TableCell>
                        <TableCell>
                          <select
                            value={order.status}
                            onChange={(e) => void updateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={cn('h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm')}
                          >
                            <option value='PENDING_PAYMENT'>Pending</option>
                            <option value='PAID'>Paid</option>
                            <option value='PROCESSING'>Processing</option>
                            <option value='COMPLETED'>Completed</option>
                            <option value='CANCELED'>Canceled</option>
                          </select>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>{formatDate(order.date)}</TableCell>
                        <TableCell>
                          <Button type='button' variant='link' className='h-auto px-0 text-xs' disabled>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Templates Tab */}
        {adminTab === 'templates' && (
          <div className='space-y-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-3xl font-bold tracking-tight'>Event Templates</h2>
                <p className='text-sm text-muted-foreground'>Create and maintain planning templates</p>
              </div>
              <Button>
                + New Template
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {loading.templates && (
                <Card>
                  <CardContent className='py-10 text-center text-muted-foreground'>
                    <span className='inline-flex items-center gap-2'>
                      <Spinner className='size-4' /> Loading templates…
                    </span>
                  </CardContent>
                </Card>
              )}
              {!loading.templates && (templates?.length ?? 0) === 0 && (
                <Card>
                  <CardContent className='py-10 text-center text-muted-foreground'>
                    No templates found
                  </CardContent>
                </Card>
              )}
              {(templates ?? []).map((template) => (
                <Card key={template.id} className='shadow-sm'>
                  <CardHeader className='space-y-1'>
                    <div className='flex items-start justify-between gap-4'>
                      <CardTitle className='text-lg'>
                        {template.emoji ? `${template.emoji} ` : ''}
                        {template.name}
                      </CardTitle>
                      <Badge variant={template.isActive ? 'secondary' : 'outline'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>{template.steps} planning steps</p>
                  </CardHeader>
                  <CardContent>
                    <div className='flex gap-2'>
                      <Button type='button' variant='secondary' className='flex-1' disabled>
                        Edit
                      </Button>
                      {template.isActive ? (
                        <Button
                          type='button'
                          variant='destructive'
                          className='flex-1'
                          onClick={() => void setTemplateActive(template.id, false)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type='button'
                          variant='secondary'
                          className='flex-1'
                          onClick={() => void setTemplateActive(template.id, true)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {adminTab === 'notifications' && (
          <div className='space-y-8'>
            <div>
              <h2 className='text-3xl font-bold tracking-tight'>Send Notifications</h2>
              <p className='text-sm text-muted-foreground'>Broadcast updates to customer segments</p>
            </div>

            <Card className='max-w-2xl'>
              <CardHeader>
                <CardTitle className='text-xl'>Compose Message</CardTitle>
              </CardHeader>
              <CardContent>
              <form
                className='space-y-6'
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitNotification();
                }}
              >
                <div>
                  <label className='block text-sm font-medium mb-2'>Recipient Type</label>
                  <select
                    value={notificationForm.recipientType}
                    onChange={(e) =>
                      setNotificationForm((s) => ({ ...s, recipientType: e.target.value }))
                    }
                    className='h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm'
                    disabled={loading.notification}
                  >
                    <option>All Customers</option>
                    <option>Pending Orders</option>
                    <option>Birthday Events</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Message Title</label>
                  <Input
                    type='text'
                    placeholder='Notification title…'
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm((s) => ({ ...s, title: e.target.value }))}
                    disabled={loading.notification}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium mb-2'>Message Content</label>
                  <Textarea
                    placeholder='Write your notification message…'
                    rows={6}
                    value={notificationForm.content}
                    onChange={(e) => setNotificationForm((s) => ({ ...s, content: e.target.value }))}
                    disabled={loading.notification}
                  />
                </div>

                <div className='flex gap-4'>
                  <Button
                    type='submit'
                    className='flex-1'
                    disabled={loading.notification || !notificationForm.title.trim() || !notificationForm.content.trim()}
                  >
                    {loading.notification && <Spinner className='size-4' />}
                    {loading.notification ? 'Sending…' : 'Send Notification'}
                  </Button>
                  <Button
                    type='button'
                    variant='secondary'
                    className='flex-1'
                    disabled={loading.notification}
                    onClick={() => setNotificationForm({ recipientType: 'All Customers', title: '', content: '' })}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
