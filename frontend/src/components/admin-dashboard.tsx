import { useState } from 'react';
import { AppScreen, User } from '@/App';

interface AdminDashboardProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (screen: AppScreen) => void;
  adminTab: string;
  onAdminTabChange: (tab: string) => void;
}

export function AdminDashboard({ user, adminTab, onAdminTabChange }: AdminDashboardProps) {
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });

  const mockStats = {
    totalCustomers: 156,
    totalOrders: 342,
    totalRevenue: 45200,
    pendingOrders: 12,
  };

  const mockOrders = [
    { id: 'ORD001', customer: 'John Doe', total: 250, status: 'Pending', date: '2025-01-19' },
    { id: 'ORD002', customer: 'Jane Smith', total: 180, status: 'Shipped', date: '2025-01-18' },
    { id: 'ORD003', customer: 'Mike Johnson', total: 320, status: 'Delivered', date: '2025-01-17' },
  ];

  const mockProducts = [
    { id: 1, name: 'Chocolate Cake', category: 'Cakes', price: 45, stock: 15 },
    { id: 2, name: 'Balloon Set', category: 'Decorations', price: 25, stock: 42 },
    { id: 3, name: 'Catering Package', category: 'Food', price: 150, stock: 8 },
  ];

  const mockTemplates = [
    { id: 1, name: 'Birthday Party', steps: 6, active: true },
    { id: 2, name: 'Proposal', steps: 6, active: true },
    { id: 3, name: 'Baby Shower', steps: 6, active: true },
  ];

  return (
    <div className='min-h-screen'>
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        {/* Overview Tab */}
        {adminTab === 'overview' && (
          <div className='space-y-8'>
            <h2 className='text-3xl font-bold'>Dashboard Overview</h2>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {[
                { label: 'Total Customers', value: mockStats.totalCustomers, color: 'from-primary' },
                { label: 'Total Orders', value: mockStats.totalOrders, color: 'from-secondary' },
                { label: 'Total Revenue', value: `$${mockStats.totalRevenue}`, color: 'from-accent' },
                { label: 'Pending Orders', value: mockStats.pendingOrders, color: 'from-destructive' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} to-transparent/10 p-6 rounded-lg border border-border`}
                >
                  <p className='text-muted-foreground text-sm mb-2'>{stat.label}</p>
                  <p className='text-3xl font-bold'>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className='bg-card border border-border rounded-lg p-6'>
              <h3 className='text-xl font-bold mb-4'>Recent Orders</h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-border'>
                    <tr>
                      <th className='text-left py-3 px-4'>Order ID</th>
                      <th className='text-left py-3 px-4'>Customer</th>
                      <th className='text-left py-3 px-4'>Total</th>
                      <th className='text-left py-3 px-4'>Status</th>
                      <th className='text-left py-3 px-4'>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrders.map(order => (
                      <tr key={order.id} className='border-b border-border hover:bg-muted/50'>
                        <td className='py-3 px-4 font-mono text-xs'>{order.id}</td>
                        <td className='py-3 px-4'>{order.customer}</td>
                        <td className='py-3 px-4'>${order.total}</td>
                        <td className='py-3 px-4'>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className='py-3 px-4 text-muted-foreground'>{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {adminTab === 'products' && (
          <div className='space-y-8'>
            <div className='flex items-center justify-between'>
              <h2 className='text-3xl font-bold'>Product Management</h2>
              <button className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90'>
                + Add Product
              </button>
            </div>

            <div className='bg-card border border-border rounded-lg p-6'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-border'>
                    <tr>
                      <th className='text-left py-3 px-4'>Product Name</th>
                      <th className='text-left py-3 px-4'>Category</th>
                      <th className='text-left py-3 px-4'>Price</th>
                      <th className='text-left py-3 px-4'>Stock</th>
                      <th className='text-left py-3 px-4'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProducts.map(product => (
                      <tr key={product.id} className='border-b border-border hover:bg-muted/50'>
                        <td className='py-3 px-4 font-semibold'>{product.name}</td>
                        <td className='py-3 px-4'>{product.category}</td>
                        <td className='py-3 px-4'>${product.price}</td>
                        <td className='py-3 px-4'>
                          <span className={product.stock > 20 ? 'text-green-600' : product.stock > 5 ? 'text-yellow-600' : 'text-red-600'}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className='py-3 px-4'>
                          <button className='text-primary hover:underline text-xs mr-3'>Edit</button>
                          <button className='text-destructive hover:underline text-xs'>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {adminTab === 'orders' && (
          <div className='space-y-8'>
            <h2 className='text-3xl font-bold'>Order Management</h2>

            <div className='bg-card border border-border rounded-lg p-6'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='border-b border-border'>
                    <tr>
                      <th className='text-left py-3 px-4'>Order ID</th>
                      <th className='text-left py-3 px-4'>Customer</th>
                      <th className='text-left py-3 px-4'>Total</th>
                      <th className='text-left py-3 px-4'>Status</th>
                      <th className='text-left py-3 px-4'>Date</th>
                      <th className='text-left py-3 px-4'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrders.map(order => (
                      <tr key={order.id} className='border-b border-border hover:bg-muted/50'>
                        <td className='py-3 px-4 font-mono text-xs'>{order.id}</td>
                        <td className='py-3 px-4'>{order.customer}</td>
                        <td className='py-3 px-4 font-semibold'>${order.total}</td>
                        <td className='py-3 px-4'>
                          <select className='px-2 py-1 rounded border border-border bg-background text-xs'>
                            <option>{order.status}</option>
                            <option>Pending</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                          </select>
                        </td>
                        <td className='py-3 px-4 text-muted-foreground'>{order.date}</td>
                        <td className='py-3 px-4'>
                          <button className='text-primary hover:underline text-xs'>View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {adminTab === 'templates' && (
          <div className='space-y-8'>
            <div className='flex items-center justify-between'>
              <h2 className='text-3xl font-bold'>Event Templates</h2>
              <button className='px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90'>
                + New Template
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {mockTemplates.map(template => (
                <div key={template.id} className='bg-card border border-border rounded-lg p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <h3 className='font-bold text-lg'>{template.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground mb-4'>{template.steps} planning steps</p>
                  <div className='flex gap-2'>
                    <button className='flex-1 text-primary hover:bg-primary/10 px-3 py-2 rounded text-sm'>Edit</button>
                    <button className='flex-1 text-destructive hover:bg-destructive/10 px-3 py-2 rounded text-sm'>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {adminTab === 'notifications' && (
          <div className='space-y-8'>
            <h2 className='text-3xl font-bold'>Send Notifications</h2>

            <div className='bg-card border border-border rounded-lg p-6 max-w-2xl'>
              <form className='space-y-6'>
                <div>
                  <label className='block font-semibold mb-2'>Recipient Type</label>
                  <select className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'>
                    <option>All Customers</option>
                    <option>Pending Orders</option>
                    <option>Birthday Events</option>
                  </select>
                </div>

                <div>
                  <label className='block font-semibold mb-2'>Message Title</label>
                  <input
                    type='text'
                    placeholder='Notification title...'
                    className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                  />
                </div>

                <div>
                  <label className='block font-semibold mb-2'>Message Content</label>
                  <textarea
                    placeholder='Write your notification message...'
                    rows={6}
                    className='w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary'
                  />
                </div>

                <div className='flex gap-4'>
                  <button
                    type='submit'
                    className='flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors'
                  >
                    Send Notification
                  </button>
                  <button
                    type='button'
                    className='flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
