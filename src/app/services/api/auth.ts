import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Constants } from '../../config/constants';

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
  constructor(private constants : Constants, private http: HttpClient) {}
  
  public async register(formData: FormData){
    const url = this.constants.API_ENDPOINT + '/api/auth/register';
    const response = await (this.http.post(url, JSON.stringify(formData)));
    return response;
  }

  public async login(username?: string, email?: string, password?: string){
    const url = this.constants.API_ENDPOINT + '/api/auth/login';
    const response = await (this.http.post(url,  { username, email, password }));
    return response;
  }

  // login(body: { username?: string; email?: string; password: string }): Observable<AuthResponse> {
  //   return this.http.post<AuthResponse>(`${this.base}/login`, body);
  // }

  saveSession(token?: string, user?: AuthUser) {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }
}
