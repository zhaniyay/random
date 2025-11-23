import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { linksApi, ordersApi, complaintsApi } from '../lib/api';
import { LinkStatus, OrderStatus } from '../models/enums';

const DashboardPage = () => {
  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: ['links'],
    queryFn: () => linksApi.getMyLinks(),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders(),
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.getMyComplaints(),
  });

  const approvedLinks = links?.filter((link: any) => link.status === LinkStatus.APPROVED) || [];
  const pendingLinks = links?.filter((link: any) => link.status === LinkStatus.PENDING) || [];
  const pendingOrders = orders?.filter((order: any) => order.status === OrderStatus.PENDING) || [];
  const activeComplaints = complaints?.filter((c: any) => c.status !== 'RESOLVED') || [];

  const stats = [
    {
      value: approvedLinks.length,
      label: 'Active Suppliers',
      color: '#4CAF50'
    },
    {
      value: pendingLinks.length,
      label: 'Pending Links',
      color: '#f59e0b'
    },
    {
      value: orders?.length || 0,
      label: 'Total Orders',
      color: '#3b82f6'
    },
    {
      value: activeComplaints.length,
      label: 'Active Complaints',
      color: '#ef4444'
    },
  ];

  if (linksLoading || ordersLoading || complaintsLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  // Generate real recent activity from actual data
  const recentActivity = [
    ...approvedLinks.slice(0, 2).map((link: any) => ({
      message: `Link approved with ${link.supplier?.name || `Supplier #${link.supplier_id}`}`,
      status: 'success',
      color: '#065f46',
      bg: '#d1fae5'
    })),
    ...pendingOrders.slice(0, 2).map((order: any) => ({
      message: `Order #${order.id} awaiting supplier confirmation`,
      status: 'pending',
      color: '#92400e',
      bg: '#fef3c7'
    })),
    ...activeComplaints.slice(0, 1).map((complaint: any) => ({
      message: `Complaint #${complaint.id} is ${complaint.status.toLowerCase()}`,
      status: 'warning',
      color: '#991b1b',
      bg: '#fee2e2'
    })),
    ...pendingLinks.slice(0, 1).map((link: any) => ({
      message: `Link request sent to ${link.supplier?.name || `Supplier #${link.supplier_id}`}`,
      status: 'info',
      color: '#1e40af',
      bg: '#dbeafe'
    }))
  ].slice(0, 5); // Show max 5 activities

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '0.5rem'
        }}>
          Dashboard
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280'
        }}>
          Overview of your supplier connections
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              color: stat.color
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '1rem',
              color: '#6b7280'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '1rem'
          }}>
            Recent Activity
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  {activity.message}
                </span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: activity.color,
                  padding: '0.25rem 0.75rem',
                  backgroundColor: activity.bg,
                  borderRadius: '0.375rem'
                }}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '1rem'
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <Link
            to="/supplier-link"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #4CAF50',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#4CAF50',
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🔗</span>
            Connect with Suppliers
          </Link>
          <Link
            to="/orders"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #3b82f6',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#3b82f6',
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            View My Orders
          </Link>
          <Link
            to="/complaints"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #ef4444',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ef4444',
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>💬</span>
            My Complaints
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
