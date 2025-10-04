import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

type Mode = 'login' | 'register';

interface AuthUser {
  uid: number;
  username: string;
  email: string;
  img: string | null;
  role: 'USER' | 'ADMIN';
  wallet_balance: number;
  created_at: string;
}
interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

@Component({
  selector: 'app-auth',
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss'],
  standalone: true, // ✅ ใช้ imports ในคอมโพเนนต์ได้
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class Auth implements OnInit {
  mode: Mode = 'login';

  // ฟอร์ม
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  // Avatar
  readonly maxAvatarMB = 2;
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  avatarPreview?: string;
  private avatarFile?: File;

  // สถานะ API
  isSubmitting = false;
  apiError?: string;

  // Base URL (เปลี่ยนเป็น environment.baseUrl ได้)
  private readonly base = 'https://game-store-backend-vs08.onrender.com/api/auth';

  // DI
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  constructor() {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
      avatar: [null], // ใช้เก็บ state error type/size
    });

    const tab = (this.route.snapshot.queryParamMap.get('tab') as Mode) || 'login';
    this.setMode(tab);
  }

  setMode(m: Mode) {
    this.mode = m;
    this.router.navigate([], { queryParams: { tab: m }, queryParamsHandling: 'merge' });
    this.apiError = undefined;
  }

  // === Avatar handlers ===
  onAvatarSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.allowedTypes.includes(file.type)) {
      this.registerForm.get('avatar')?.setErrors({ type: true });
      return;
    }
    if (file.size > this.maxAvatarMB * 1024 * 1024) {
      this.registerForm.get('avatar')?.setErrors({ size: true });
      return;
    }

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.avatarPreview = reader.result as string);
    reader.readAsDataURL(file);
    this.registerForm.get('avatar')?.setErrors(null);
  }

  clearAvatar() {
    this.avatarFile = undefined;
    this.avatarPreview = undefined;
    this.registerForm.patchValue({ avatar: null });
    this.registerForm.get('avatar')?.setErrors(null);
  }

  // === Submit: Login ===
  submitLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    this.apiError = undefined;

    const { email, password } = this.loginForm.value as { email: string; password: string };

    // แบ็กเอนด์รองรับ username หรือ email — ตรงนี้ส่ง email
    this.http.post<AuthResponse>(`${this.base}/login`, { email, password })
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.token || !res.user) {
            this.apiError = res.message || 'Login failed';
            return;
          }
          // เก็บ session แบบง่าย ๆ
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          // ไปหน้าหลัก (แก้ปลายทางตามที่ต้องการ)
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          this.apiError = err?.error?.message || err.message || 'Login error';
        }
      });
  }

  // === Submit: Register ===
  submitRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }

    const { username, email, password, confirm } = this.registerForm.value as any;
    if (password !== confirm) {
      this.registerForm.get('confirm')?.setErrors({ notMatch: true });
      return;
    }

    // FormData (สำคัญ: คีย์ไฟล์ต้องเป็น 'image' ให้ตรงกับ backend: upload.single('image'))
    const form = new FormData();
    form.append('username', username);
    form.append('email', email);
    form.append('password', password);
    if (this.avatarFile) form.append('image', this.avatarFile); // ⬅️ เปลี่ยนจาก 'avatar' เป็น 'image'

    this.isSubmitting = true;
    this.apiError = undefined;

    this.http.post<AuthResponse>(`${this.base}/register`, form)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.token || !res.user) {
            this.apiError = res.message || 'Register failed';
            return;
          }
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          this.apiError = err?.error?.message || err.message || 'Register error';
        }
      });
  }
}
