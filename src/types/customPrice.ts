// src/types/customPrice.ts

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  userName?: string;
  action: 'created' | 'updated' | 'deleted';
  oldValue?: number;
  newValue?: number;
  note?: string;
}

export interface CustomPrice {
  id: string;
  portalId: string;
  workspaceId: string;
  price: number;
  approvedByPortal: boolean;
  newPrice?: number; // Pending price waiting for approval
  auditLog: AuditLogEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface CustomPriceInput {
  portalId: string;
  workspaceId: string;
  price: number;
  note?: string;
}
