// Link Status
export const LinkStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const;

export type LinkStatusType = typeof LinkStatus[keyof typeof LinkStatus];

// Order Status
export const OrderStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Complaint Status
export const ComplaintStatus = {
  NEW: 'NEW',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
} as const;

export type ComplaintStatusType = typeof ComplaintStatus[keyof typeof ComplaintStatus];

// Incident Status removed - using Complaint Status for both consumer and supplier issues

// User Roles
export const Role = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  SALES: 'SALES',
} as const;

export type RoleType = typeof Role[keyof typeof Role];

