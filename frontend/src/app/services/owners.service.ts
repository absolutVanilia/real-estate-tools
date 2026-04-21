import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/owners/`;

export interface Owner {
  id: number;
  name: string;
  cedula: string;
  phone: string;
  email: string;
  is_active: boolean;
  status_label: string;
  created_by: number | null;
  created_by_display: string;
  company: number | null;
  company_display?: string;
  created_at: string;
  updated_at?: string;
}

export interface OwnerFilters {
  is_active?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedOwners {
  count: number;
  next: string | null;
  previous: string | null;
  results: Owner[];
}

export interface OwnerPayload {
  name: string;
  cedula: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OwnersService {
  constructor(private http: HttpClient) {}

  list(filters: OwnerFilters = {}): Observable<PaginatedOwners> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedOwners>(API_URL, { params });
  }

  get(id: number): Observable<Owner> {
    return this.http.get<Owner>(`${API_URL}${id}/`);
  }

  create(payload: OwnerPayload): Observable<Owner> {
    return this.http.post<Owner>(API_URL, payload);
  }

  update(id: number, payload: Partial<OwnerPayload>): Observable<Owner> {
    return this.http.patch<Owner>(`${API_URL}${id}/`, payload);
  }

  toggleActive(id: number): Observable<Owner> {
    return this.http.patch<Owner>(`${API_URL}${id}/toggle-active/`, {});
  }
}