import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi, ordersApi } from '../lib/api';
import type { ComplaintOut } from '../types/api';
import { ComplaintStatus } from '../models/enums';
import type { ComplaintStatusType } from '../models/enums';

const ComplaintsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [complaintDescription, setComplaintDescription] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusType | ''>('');

  const queryClient = useQueryClient();

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: () => complaintsApi.getMyComplaints(statusFilter || undefined),
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders(),
    enabled: showCreateForm,
  });

  const createComplaintMutation = useMutation({
    mutationFn: (data: { order_id: number; description: string }) =>
      complaintsApi.createComplaint(data),
    onSuccess: () => {
      setShowCreateForm(false);
      setSelectedOrderId(null);
      setComplaintDescription('');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderId && complaintDescription.trim()) {
      createComplaintMutation.mutate({
        order_id: selectedOrderId,
        description: complaintDescription.trim(),
      });
    }
  };

  const getStatusColor = (status: ComplaintStatusType) => {
    switch (status) {
      case ComplaintStatus.NEW:
        return { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' };
      case ComplaintStatus.ESCALATED:
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case ComplaintStatus.RESOLVED:
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

  const complaintableOrders = orders?.filter((order: any) =>
    order.status !== 'CANCELLED'
  ) || [];

  if (complaintsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading...</div>
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
            My Complaints
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            View and manage your order complaints
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : 'New Complaint'}
        </button>
      </div>

      {/* Create Complaint Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Create New Complaint
          </h3>
          <form onSubmit={handleCreateComplaint} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Select Order
              </label>
              {ordersLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading orders...
                </div>
              ) : (
                <select
                  value={selectedOrderId || ''}
                  onChange={(e) => setSelectedOrderId(parseInt(e.target.value) || null)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Select an order...</option>
                  {complaintableOrders.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      Order #{order.id} - ${Number(order.total_amount).toFixed(2)} ({order.status})
                    </option>
                  ))}
                </select>
              )}
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                Only non-cancelled orders can have complaints
              </p>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Complaint Description
              </label>
              <textarea
                rows={4}
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Describe your complaint in detail..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {createComplaintMutation.isError && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                Failed to create complaint. Please try again.
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createComplaintMutation.isPending || !selectedOrderId || !complaintDescription.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: createComplaintMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: (createComplaintMutation.isPending || !selectedOrderId || !complaintDescription.trim()) ? 0.5 : 1
                }}
              >
                {createComplaintMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

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
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatusType | '')}
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
            <option value="">All Complaints</option>
            <option value={ComplaintStatus.NEW}>New</option>
            <option value={ComplaintStatus.ESCALATED}>Escalated</option>
            <option value={ComplaintStatus.RESOLVED}>Resolved</option>
          </select>
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {complaints?.length || 0} complaint{complaints?.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Complaints List */}
      {complaints && complaints.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {complaints.map((complaint: ComplaintOut) => {
            const statusStyle = getStatusColor(complaint.status);
            return (
              <div
                key={complaint.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem'
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
                      Complaint #{complaint.id}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Order #{complaint.order_id} • Supplier #{complaint.supplier_id}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Created: {new Date(complaint.created_at).toLocaleDateString()}
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
                    {complaint.status}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.95rem',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  {complaint.description}
                </p>
              </div>
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
            💬
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            No complaints found
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} complaints found.` : "You haven't submitted any complaints yet."}
          </p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ffffff',
                backgroundColor: '#4CAF50',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Submit First Complaint
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
