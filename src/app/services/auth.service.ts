import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expiresAt: string;
}

interface JwtPayload {
  sub: string;
  unique_name: string;
  email: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
  loja_id?: string;
  loja_ids?: string;
  token_ver?: number;
  empresa_id?: string;
  screen_perms?: string;
  role?: string;
  exp: number;
}

const TOKEN_KEY = 'token';
const API_BASE = 'http://localhost:8000/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { username, password })
      .pipe(tap(res => localStorage.setItem(TOKEN_KEY, res.token)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodePayload(token);
      // exp is in seconds
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUsername(): string {
    const token = this.getToken();
    if (!token) return '';
    try {
      return this.decodePayload(token).unique_name ?? '';
    } catch {
      return '';
    }
  }

  getRole(): string {
    const token = this.getToken();
    if (!token) return '';
    try {
      const p = this.decodePayload(token);
      // Backend emits "role" claim directly (not WS-Federation style)
      return p.role ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? '';
    } catch {
      return '';
    }
  }

  getScreenPerms(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const raw = this.decodePayload(token).screen_perms;
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  canAccessTela(slug: string): boolean {
    const role = this.getRole();
    if (role === 'admin') return true;
    return this.getScreenPerms().includes(slug);
  }

  getLojaId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodePayload(token).loja_id ?? null;
    } catch {
      return null;
    }
  }

  getLojaIds(): string[] {
    const token = this.getToken();
    if (!token) return [];
    try {
      const ids = this.decodePayload(token).loja_ids;
      return ids ? ids.split(',').filter(id => id.trim()) : [];
    } catch {
      return [];
    }
  }

  getEmpresaId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return this.decodePayload(token).empresa_id ?? null;
    } catch {
      return null;
    }
  }

  private decodePayload(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  }
}
