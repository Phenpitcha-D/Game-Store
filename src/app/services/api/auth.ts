import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface AuthUser {
  uid: number;
  username: string;
  email: string;
  img: string | null;
  role: 'USER' | 'ADMIN';
  wallet_balance: number;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  // เปลี่ยนเป็น environment ถ้ามี
  private base = 'https://game-store-backend-vs08.onrender.com/api/auth';

  register(formData: FormData): Observable<AuthResponse> {
    // **อย่าเซ็ต Content-Type เอง** ให้ HttpClient จัดการ boundary
    return this.http.post<AuthResponse>(`${this.base}/register`, formData);
  }

  login(body: { username?: string; email?: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body);
  }

  saveSession(token?: string, user?: AuthUser) {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }
}
