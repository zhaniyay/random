// Frontend enum values matching backend enums
export const LinkStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export const ComplaintStatus = {
  NEW: 'NEW',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
} as const;

export const IncidentStatus = {
  NEW: 'NEW',
  RESOLVED: 'RESOLVED',
} as const;

export type LinkStatusType = typeof LinkStatus[keyof typeof LinkStatus];
export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type ComplaintStatusType = typeof ComplaintStatus[keyof typeof ComplaintStatus];
export type IncidentStatusType = typeof IncidentStatus[keyof typeof IncidentStatus];
