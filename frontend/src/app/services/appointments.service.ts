import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://127.0.0.1:8000/api/appointments/';

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  status_display: string;
  property_code: string;
  key_number: string;
  property_address: string;
  sector: string;
  interested_name: string;
  interested_phone: string;
  scheduled_by: number | null;
  scheduled_by_display: string;
  company: number | null;
  company_display?: string;
  notes: string;
  created_at: string;
  updated_at?: string;
}

export interface AppointmentFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  sector?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAppointments {
  count: number;
  next: string | null;
  previous: string | null;
  results: Appointment[];
}

export interface AppointmentPayload {
  date: string;
  time: string;
  status?: string;
  property_code?: string;
  key_number?: string;
  property_address: string;
  sector?: string;
  interested_name: string;
  interested_phone?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private http: HttpClient) {}

  list(filters: AppointmentFilters = {}): Observable<PaginatedAppointments> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedAppointments>(API_URL, { params });
  }

  get(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${API_URL}${id}/`);
  }

  create(payload: AppointmentPayload): Observable<Appointment> {
    return this.http.post<Appointment>(API_URL, payload);
  }

  update(id: number, payload: Partial<AppointmentPayload>): Observable<Appointment> {
    return this.http.patch<Appointment>(`${API_URL}${id}/`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}${id}/`);
  }
}