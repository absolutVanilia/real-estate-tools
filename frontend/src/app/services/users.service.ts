import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/api/users/`;

export type UserRole = 'admin' | 'promotor';

export interface UserItem {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  company: number | null;
  is_platform_admin: boolean;
}

export interface CreateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  role: UserRole;
  company?: number | null;
}

export interface UpdateUserRequest {
  username: string;
  first_name: string;
  last_name: string;
  password?: string;
  role: UserRole;
  company?: number | null;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  list(): Observable<UserItem[]> {
    return this.http.get<UserItem[]>(API_URL);
  }

  create(payload: CreateUserRequest): Observable<UserItem> {
    return this.http.post<UserItem>(API_URL, payload);
  }

  update(userId: number, payload: UpdateUserRequest): Observable<UserItem> {
    return this.http.put<UserItem>(`${API_URL}${userId}/`, payload);
  }

  remove(userId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}${userId}/`);
  }
}
