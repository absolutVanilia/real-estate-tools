import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const API_URL = 'http://127.0.0.1:8000/api';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_USER_KEY = 'auth_user';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'promotor';
  company: number | null;
  is_platform_admin: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.readUserFromStorage());

  currentUser$ = this.currentUserSubject.asObservable();

  /** Cliente sin interceptores para evitar ciclos (login no debe pasar por el interceptor de Bearer). */
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login/`, payload).pipe(
      tap((response) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.currentUserSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  refreshUserFromStorage(): void {
    this.currentUserSubject.next(this.readUserFromStorage());
  }

  isPlatformAdmin(): boolean {
    return !!this.getCurrentUser()?.is_platform_admin;
  }

  isCompanyAdmin(): boolean {
    const u = this.getCurrentUser();
    return !!u && u.role === 'admin' && !u.is_platform_admin;
  }

  canSeeAdministration(): boolean {
    const u = this.getCurrentUser();
    if (!u) {
      return false;
    }
    return u.is_platform_admin || u.role === 'admin';
  }

  private readUserFromStorage(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
