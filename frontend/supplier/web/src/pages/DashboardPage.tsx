import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { linksApi, ordersApi, productsApi, complaintsApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Package, ShoppingBag, Link2, Clock, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: pendingLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['pending-links'],
    queryFn: () => linksApi.getPendingLinks(),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => ordersApi.getSupplierOrders(undefined, 20),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', user?.supplier_id],
    queryFn: () => productsApi.getMyProducts(user!.supplier_id, false),
    enabled: !!user?.supplier_id,
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getMyComplaints(),
  });

  const pendingLinksCount = pendingLinks?.length || 0;
  const pendingOrdersCount = orders?.filter((o: any) => o.status === 'PENDING').length || 0;
  const activeComplaintsCount = complaints?.filter((c: any) => c.status !== 'RESOLVED').length || 0;
  const activeProductsCount = products?.length || 0;

  const stats = [
    {
      title: "Pending Links",
      count: pendingLinksCount,
      icon: Link2,
      color: "#ffc107",
      bgColor: "rgba(255, 193, 7, 0.1)",
      description: "Need approval",
      action: () => navigate("/links"),
    },
    {
      title: "Pending Orders",
      count: pendingOrdersCount,
      icon: Clock,
      color: "#ff9800",
      bgColor: "rgba(255, 152, 0, 0.1)",
      description: "Awaiting response",
      action: () => navigate("/orders"),
    },
    {
      title: "Active Complaints",
      count: activeComplaintsCount,
      icon: AlertTriangle,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
      description: "Need attention",
      action: () => navigate("/complaints"),
    },
    {
      title: "Active Products",
      count: activeProductsCount,
      icon: Package,
      color: "#4CAF50",
      bgColor: "rgba(76, 175, 80, 0.1)",
      description: "In catalog",
      action: () => navigate("/products"),
    },
  ];

  const isLoading = linksLoading || ordersLoading || productsLoading || complaintsLoading;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a' }}>Dashboard</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Welcome back! Here's your business overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              onClick={stat.action}
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderRadius: '0.75rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 0%' }}>
                  <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: stat.bgColor }}>
                    <Icon style={{ height: '1.5rem', width: '1.5rem', color: stat.color }} />
                  </div>
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{stat.title}</p>
                    <p style={{ fontSize: '1.875rem', marginTop: '0.25rem', fontWeight: 700, color: '#1a1a1a' }}>{stat.count}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{stat.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Recent Orders */}
        <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>Recent Orders</h3>
            <button
              onClick={() => navigate('/orders')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', color: '#6b7280', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', fontSize: '0.875rem', fontWeight: 500 }}
            >
              View All
              <TrendingUp style={{ height: '1rem', width: '1rem' }} />
            </button>
          </div>

          {orders && orders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orders.slice(0, 5).map((order: any) => {
                const statusColors: Record<string, any> = {
                  PENDING: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
                  ACCEPTED: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
                  REJECTED: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
                  CANCELLED: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
                };
                const statusStyle = statusColors[order.status] || statusColors.PENDING;
                
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 245, 245, 0.5)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.8)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.5)'}
                  >
                    <div style={{ flex: '1 1 0%' }}>
                      <p style={{ fontWeight: 600, color: '#1a1a1a' }}>Order #{order.id}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Consumer #{order.consumer_id} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1a1a1a' }}>
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: statusStyle.color,
                        backgroundColor: statusStyle.bg,
                        border: `1px solid ${statusStyle.border}`,
                        borderRadius: '9999px'
                      }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Package style={{ height: '3rem', width: '3rem', margin: '0 auto', marginBottom: '0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No orders yet</p>
            </div>
          )}
        </div>

        {/* Pending Link Requests */}
        {pendingLinksCount > 0 && (
          <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertCircle style={{ height: '1.25rem', width: '1.25rem', color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#92400e' }}>
                {pendingLinksCount} Pending Link Request{pendingLinksCount !== 1 ? 's' : ''}
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '1rem' }}>
              You have consumer link requests waiting for approval
            </p>
            <button
              onClick={() => navigate('/links')}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', backgroundColor: '#f59e0b', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Review Requests
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

