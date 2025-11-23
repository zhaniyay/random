import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../lib/api';
import type { OrderOut } from '../types/api';
import { OrderStatus } from '../models/enums';
import type { OrderStatusType } from '../models/enums';

const OrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatusType | ''>('');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getMyOrders(statusFilter || undefined),
  });

  const getStatusColor = (status: OrderStatusType) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case OrderStatus.ACCEPTED:
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      case OrderStatus.REJECTED:
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case OrderStatus.CANCELLED:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.75rem',
        color: '#991b1b'
      }}>
        Failed to load orders. Please try again later.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            My Orders
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            View and manage all your orders
          </p>
        </div>
      </div>

      {/* Filter */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatusType | '')}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Orders</option>
            <option value={OrderStatus.PENDING}>Pending</option>
            <option value={OrderStatus.ACCEPTED}>Accepted</option>
            <option value={OrderStatus.REJECTED}>Rejected</option>
            <option value={OrderStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      {orders && orders.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {orders.map((order: OrderOut) => {
            const statusStyle = getStatusColor(order.status);
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                style={{
                  display: 'block',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#4CAF50';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      marginBottom: '0.25rem'
                    }}>
                      Order #{order.id}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Supplier #{order.supplier_id} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    borderRadius: '9999px'
                  }}>
                    {order.status}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#1a1a1a'
                  }}>
                    ${Number(order.total_amount).toFixed(2)}
                  </div>
                </div>

                {order.comment && (
                  <p style={{
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    "{order.comment}"
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            📦
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            No orders found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} orders found.` : "You haven't placed any orders yet."}
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            Browse Suppliers
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
