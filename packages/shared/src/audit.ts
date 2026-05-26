export interface AuditLogEntry {
  id: string;
  actorEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
