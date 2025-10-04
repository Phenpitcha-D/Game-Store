import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Convert, UserLoginRespon } from '../../models/user_login_res';

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
  standalone: true,
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
    // LOGIN: ช่องเดียวรองรับ username หรือ email
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.minLength(2)]], // ใช้เป็น identity
      password: ['', [Validators.required]],
    });

    // REGISTER: ถ้าคุณมีฟิลด์ wallet ใน template สามารถ bind formControlName="wallet" ได้เลย (optional)
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirm: ['', [Validators.required]],
      wallet: [null, [Validators.min(0)]], // ไม่ใส่ก็ได้
      avatar: [null], // state error type/size
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

  // === helpers ===
  private isEmail(text: string): boolean {
    return /\S+@\S+\.\S+/.test(String(text || '').trim());
  }

  /** ทำให้โครงสร้าง response ปลอดภัยต่อการแปลง/เก็บ */
  private normalizeAuthResponse(res: AuthResponse): AuthResponse {
    const user = res?.user;
    return {
      ...res,
      user: user
        ? {
            ...user,
            img: (user.img ?? '') as any,                  // กัน null ทำให้ Convert ไม่ล้ม
            role: (user.role || 'USER').toUpperCase() as any, // กัน lower/upper case
          }
        : undefined,
    };
  }

  /** เก็บ session + ยิง event + route หน้าแรก */
  private persistAndRoute(res: AuthResponse) {
    // เก็บฉบับ normalized ไว้ก่อน (ชัวร์สุด)
    localStorage.setItem('token', res.token!);
    localStorage.setItem('user', JSON.stringify(res));

    // ถ้าคุณต้องใช้ Convert เพื่อความเข้ากันได้กับส่วนอื่น ลองแปลงแบบไม่ทำให้พัง
    try {
      const validated: UserLoginRespon = Convert.toUserLoginRespon(JSON.stringify(res));
      localStorage.setItem('user', Convert.userLoginResponToJson(validated));
    } catch {
      // ถ้าไม่ผ่านก็ใช้ JSON ที่ normalize แล้ว
    }

    window.dispatchEvent(new CustomEvent('auth-changed'));
    this.router.navigateByUrl('/');
  }

  // === Submit: Login (รองรับ username หรือ email) ===
  submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.apiError = undefined;

    const { email, password } = this.loginForm.value as { email: string; password: string };
    const identity = (email || '').trim();

    // เลือก payload ตามรูปแบบที่พิมพ์
    const body: Record<string, any> = this.isEmail(identity)
      ? { email: identity, password }
      : { username: identity, password };

    this.http
      .post<AuthResponse>(`${this.base}/login`, body)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (raw) => {
          if (!raw?.success || !raw?.token || !raw?.user) {
            this.apiError = raw?.message || 'Login failed';
            return;
          }
          const normalized = this.normalizeAuthResponse(raw);
          this.persistAndRoute(normalized);
        },
        error: (err) => {
          this.apiError = err?.error?.message || err.message || 'Login error';
        },
      });
  }

  // === Submit: Register (รองรับไม่มีรูป/มีรูป) ===
  submitRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username, email, password, confirm, wallet } = this.registerForm.value as any;
    if (password !== confirm) {
      this.registerForm.get('confirm')?.setErrors({ notMatch: true });
      return;
    }

    // ใช้ FormData เสมอได้ (ทั้งกรณีมี/ไม่มีรูป) — backend ของคุณรับได้
    const form = new FormData();
    form.append('username', username);
    form.append('email', email);
    form.append('password', password);
    if (wallet !== null && wallet !== undefined && wallet !== '') {
      form.append('wallet', String(wallet));
    }
    if (this.avatarFile) {
      form.append('image', this.avatarFile); // ให้ตรง backend: upload.single('image')
    }

    this.isSubmitting = true;
    this.apiError = undefined;

    this.http
      .post<AuthResponse>(`${this.base}/register`, form)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (raw) => {
          if (!raw?.success || !raw?.token || !raw?.user) {
            this.apiError = raw?.message || 'Register failed';
            return;
          }
          const normalized = this.normalizeAuthResponse(raw);
          this.persistAndRoute(normalized);
        },
        error: (err) => {
          this.apiError = err?.error?.message || err.message || 'Register error';
        },
      });
  }
}
