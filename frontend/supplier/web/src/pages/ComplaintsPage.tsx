import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi, ordersApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { ComplaintOut } from '../types/api';
import { ComplaintStatus } from '../models/enums';
import type { ComplaintStatusType } from '../models/enums';
import { AlertTriangle, Check, TrendingUp } from 'lucide-react';

const ComplaintsPage = () => {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusType | ''>('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Check user role for complaint handling permissions
  const isSales = user?.role === 'SALES';
  const isManager = user?.role === 'MANAGER';
  const isOwner = user?.role === 'OWNER';
  const canResolveEscalated = isOwner || isManager;

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints', statusFilter],
    queryFn: () => complaintsApi.getMyComplaints(statusFilter || undefined),
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: (complaintId: number) => complaintsApi.resolveComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  const escalateComplaintMutation = useMutation({
    mutationFn: (complaintId: number) => complaintsApi.escalateComplaint(complaintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });

  const handleResolve = (complaintId: number) => {
    if (window.confirm('Mark this complaint as resolved?')) {
      resolveComplaintMutation.mutate(complaintId);
    }
  };

  const handleEscalate = (complaintId: number) => {
    if (window.confirm('Escalate this complaint to management?')) {
      escalateComplaintMutation.mutate(complaintId);
    }
  };

  const getStatusColor = (status: ComplaintStatusType) => {
    switch (status) {
      case ComplaintStatus.NEW:
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case ComplaintStatus.ESCALATED:
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case ComplaintStatus.RESOLVED:
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
    }
  };

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
            Customer Complaints
          </h1>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            {isManager 
              ? 'View and resolve escalated complaints from Sales' 
              : 'View and manage complaints from consumers'}
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
            <option value="">{isManager ? 'All Escalated' : 'All Complaints'}</option>
            {!isManager && <option value={ComplaintStatus.NEW}>New</option>}
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
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <AlertTriangle style={{ height: '1.25rem', width: '1.25rem', color: '#f59e0b' }} />
                      Complaint #{complaint.id}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      #{complaint.id} • Order #{complaint.order_id} • From Consumer #{complaint.consumer_id} • Created: {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                    {complaint.status === ComplaintStatus.NEW && (
                      <>
                        <button
                          onClick={() => handleEscalate(complaint.id)}
                          disabled={escalateComplaintMutation.isPending}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            backgroundColor: '#f59e0b',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: escalateComplaintMutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: escalateComplaintMutation.isPending ? 0.6 : 1
                          }}
                        >
                          <TrendingUp style={{ height: '1rem', width: '1rem' }} />
                          Escalate
                        </button>
                        <button
                          onClick={() => handleResolve(complaint.id)}
                          disabled={resolveComplaintMutation.isPending}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            backgroundColor: '#4CAF50',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: resolveComplaintMutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: resolveComplaintMutation.isPending ? 0.6 : 1
                          }}
                        >
                          <Check style={{ height: '1rem', width: '1rem' }} />
                          Resolve
                        </button>
                      </>
                    )}
                    {complaint.status === ComplaintStatus.ESCALATED && canResolveEscalated && (
                      <button
                        onClick={() => handleResolve(complaint.id)}
                        disabled={resolveComplaintMutation.isPending}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#ffffff',
                          backgroundColor: '#4CAF50',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: resolveComplaintMutation.isPending ? 'not-allowed' : 'pointer',
                          opacity: resolveComplaintMutation.isPending ? 0.6 : 1
                        }}
                      >
                        <Check style={{ height: '1rem', width: '1rem' }} />
                        Resolve
                      </button>
                    )}
                    {complaint.status === ComplaintStatus.ESCALATED && isSales && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        padding: '0.5rem 1rem'
                      }}>
                        Escalated to Manager/Owner
                      </p>
                    )}
                  </div>
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
            ⚠️
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '0.5rem'
          }}>
            {isManager ? 'No escalated complaints' : 'No complaints found'}
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            {isManager 
              ? 'No complaints have been escalated by Sales yet. Escalated complaints will appear here.' 
              : statusFilter 
                ? `No ${statusFilter.toLowerCase()} complaints found.` 
                : 'No complaints from consumers yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;

