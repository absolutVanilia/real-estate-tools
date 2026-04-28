import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/properties/`;
const USERS_URL = `${environment.apiUrl}/api/users/`;

export interface Property {
  id: number;
  codigo: string;
  pre_inventario: boolean;
  sector: string;
  direccion: string;
  punto_referencia: string;
  precio_arriendo: number | null;
  precio_venta: number | null;
  area: number | null;
  piso_numero: number | null;
  estrato: number | null;
  alcobas: number;
  banos: number;
  tipo_zona_social: string;
  tipo_zona_social_display: string;
  alcoba_servicio: boolean;
  cuarto_util: boolean;
  patio: boolean;
  zona_ropa: boolean;
  balcon: boolean;
  terraza: boolean;
  solar: boolean;
  sotano: boolean;
  parqueadero: boolean;
  numero_closets: number;
  numero_llaves: number;
  luz_trifilar: boolean;
  gas: boolean;
  calentador: boolean;
  tipo_cocina: string;
  tipo_cocina_display: string;
  tipo_piso: string;
  tipo_piso_display: string;
  observacion: string;
  novedad: string;
  propietarios_detail: OwnerMini[];
  asesor: number | null;
  asesor_display: string;
  created_by: number | null;
  created_by_display: string;
  company: number | null;
  company_display?: string;
  created_at: string;
  updated_at?: string;
}

export interface OwnerMini {
  id: number;
  name: string;
  cedula: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface PropertyFilters {
  search?: string;
  sector?: string;
  estrato?: string;
  pre_inventario?: string;
  precio_arriendo_min?: string;
  precio_arriendo_max?: string;
  alcobas_min?: string;
  banos_min?: string;
  parqueadero?: string;
  asesor?: string;
  propietario?: string;
  tipo_piso?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedProperties {
  count: number;
  next: string | null;
  previous: string | null;
  results: Property[];
}

export interface TeamMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  constructor(private http: HttpClient) {}

  list(filters: PropertyFilters = {}): Observable<PaginatedProperties> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedProperties>(API_URL, { params });
  }

  get(id: number): Observable<Property> {
    return this.http.get<Property>(`${API_URL}${id}/`);
  }

  create(payload: any): Observable<Property> {
    return this.http.post<Property>(API_URL, payload);
  }

  update(id: number, payload: any): Observable<Property> {
    return this.http.patch<Property>(`${API_URL}${id}/`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}${id}/`);
  }

  getTeamMembers(): Observable<any> {
    return this.http.get<any>(`${USERS_URL}?page_size=200`);
  }
}