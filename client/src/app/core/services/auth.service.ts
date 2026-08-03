import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { StorageService } from './storage.service';

export interface LoginResponse {
  token?: string;
  onboarded?: boolean;
  requires2fa?: boolean;
  method?: 'totp' | 'email';
  challengeToken?: string;
}

export interface JwtPayload {
  sub: string;
  tenant_id: string | null;
  role: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private jwtHelper = new JwtHelperService();
  private base = '/api/auth';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, password });
  }

  register(payload: {
    tenantName: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/register`, payload);
  }

  verify2fa(challengeToken: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/2fa/verify`, { challengeToken, code });
  }

  forgotPassword(email: string): Observable<{ sent: boolean }> {
    return this.http.post<{ sent: boolean }>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ reset: boolean }> {
    return this.http.post<{ reset: boolean }>(`${this.base}/reset-password`, { token, password });
  }

  completeOnboarding(): Observable<{ onboarded: boolean }> {
    return this.http.post<{ onboarded: boolean }>(`${this.base}/onboarding/complete`, {});
  }

  storeSession(token: string, rememberMe = true): void {
    this.storage.setToken(token, rememberMe);
  }

  logout(): void {
    this.storage.clearToken();
  }

  isLoggedIn(): boolean {
    const token = this.storage.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  currentUser(): JwtPayload | null {
    const token = this.storage.getToken();
    if (!token) return null;
    try {
      return this.jwtHelper.decodeToken(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
