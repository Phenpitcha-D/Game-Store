import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class Login implements OnInit {
  mode: Mode = 'login';

  // ฟอร์ม
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  readonly maxAvatarMB = 2;
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  avatarPreview?: string;     // data URL สำหรับแสดงพรีวิว
  private avatarFile?: File;  // ไฟล์จริง (ส่งไป backend)

  private fb = inject(FormBuilder);
  constructor(private route: ActivatedRoute, private router: Router) {}

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
      avatar: [null], // เก็บ error state/type/size ได้
    });

    const tab = (this.route.snapshot.queryParamMap.get('tab') as Mode) || 'login';
    this.setMode(tab);
  }

  setMode(m: Mode) {
    this.mode = m;
    this.router.navigate([], { queryParams: { tab: m }, queryParamsHandling: 'merge' });
  }

  // === Avatar handlers ===
  onAvatarSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // ชนิดไฟล์
    if (!this.allowedTypes.includes(file.type)) {
      this.registerForm.get('avatar')?.setErrors({ type: true });
      return;
    }
    // ขนาดไฟล์
    if (file.size > this.maxAvatarMB * 1024 * 1024) {
      this.registerForm.get('avatar')?.setErrors({ size: true });
      return;
    }

    // ผ่าน: เก็บไฟล์ + ทำพรีวิว
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

  // === Submit ===
  submitLogin() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    console.log('LOGIN ->', this.loginForm.value);
  }

  submitRegister() {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }

    const { password, confirm } = this.registerForm.value as any;
    if (password !== confirm) {
      this.registerForm.get('confirm')?.setErrors({ notMatch: true });
      return;
    }

    // ตัวอย่าง payload เป็น FormData (รองรับไฟล์)
    const v = this.registerForm.value as any;
    const form = new FormData();
    form.append('username', v.username);
    form.append('email', v.email);
    form.append('password', v.password);
    if (this.avatarFile) form.append('avatar', this.avatarFile);

    console.log('REGISTER (FormData) -> username/email/password + avatar file', this.avatarFile);

    // ส่งจริง:
    // this.http.post('/api/auth/register', form).subscribe(...)
  }
}
