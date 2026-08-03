import { Injectable } from '@angular/core';

const TOKEN_KEY = 'ev_token';

@Injectable({ providedIn: 'root' })
export class StorageService {
  setToken(token: string, rememberMe: boolean): void {
    this.clearToken();
    (rememberMe ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
