import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/companies/`;

export interface Company {
  id: number;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  constructor(private http: HttpClient) {}

  list(): Observable<Company[]> {
    return this.http.get<Company[]>(API_URL);
  }

  create(payload: CreateCompanyRequest): Observable<Company> {
    return this.http.post<Company>(API_URL, payload);
  }
}
