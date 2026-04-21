import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/audit-logs/`;

export interface AuditLog {
  id: number;
  user: number | null;
  user_display: string;
  company: number | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  resource_display: string;
  description: string;
  changes: Record<string, { old: any; new: any }>;
  metadata: Record<string, any>;
  tags: string[];
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  tag?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAuditLogs {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
  filter_options: {
    actions: string[];
    resource_types: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  constructor(private http: HttpClient) {}

  list(filters: AuditLogFilters = {}): Observable<PaginatedAuditLogs> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedAuditLogs>(API_URL, { params });
  }
}