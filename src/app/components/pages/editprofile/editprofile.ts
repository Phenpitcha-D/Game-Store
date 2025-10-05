import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Convert, User, UserLoginRespon } from '../../models/user_login_res';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

interface ProfileUser {
  uid: string;
  username: string;
  email: string;
  img?: string | null;
}

@Component({
  selector: 'app-editprofile',
  imports: [ReactiveFormsModule, CommonModule,HttpClientModule],
  templateUrl: './editprofile.html',
  styleUrl: './editprofile.scss'
})
export class Editprofile {

  EditForm!: FormGroup;
  currentUser: UserLoginRespon | undefined;
  isSaving = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private constants: Constants
  ) {
    
  this.EditForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      avatar: [null],
    });
  }

  ngOnInit(): void {
    this.loadUser();
    this.hydrateFormFromSession();
    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged);
  }

  private loadUser() {
    this.currentUser = undefined;
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      this.currentUser = Convert.toUserLoginRespon(raw);
    } catch {
      this.currentUser = undefined;
    }
  }

  // ดึงค่าจาก session (currentUser) มาใส่ฟอร์ม
  private hydrateFormFromSession() {
    const u = this.currentUser?.user;
    if (!u) return;
    this.EditForm.patchValue({
      username: u.username ?? '',
      email: u.email ?? '',
    });
    this.avatarPreview = u.img; 
  }

  // ===== Avatar =====
  readonly maxAvatarMB = 2;
  readonly allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  avatarPreview?: string;
  private avatarFile?: File;

onAvatarSelected(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!this.allowedTypes.includes(file.type)) {
    this.EditForm.get('avatar')?.setErrors({ type: true });
    return;
  }
  if (file.size > this.maxAvatarMB * 1024 * 1024) {
    this.EditForm.get('avatar')?.setErrors({ size: true });
    return;
  }

  this.avatarFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    this.avatarPreview = reader.result as string;
    this.cdr.markForCheck();                      
  };
  reader.readAsDataURL(file);
  this.EditForm.get('avatar')?.setErrors(null);
}

clearAvatar() {
  this.avatarFile = undefined;
  this.avatarPreview = this.currentUser?.user?.img || undefined;
  this.EditForm.patchValue({ avatar: null });
  this.EditForm.get('avatar')?.setErrors(null);
  this.cdr.markForCheck();                                       
}


  private onAuthChanged = () => {
    this.loadUser();
    this.hydrateFormFromSession();           //อัปเดตฟอร์มตาม session ที่เพิ่งเปลี่ยน
    this.cdr.markForCheck();
  };

submitEdit() {
  if (this.EditForm.invalid) { this.EditForm.markAllAsTouched(); return; }

  const uid = this.currentUser?.user?.uid;
  if (!uid) { console.error('No UID in currentUser'); return; }

  const { username, email } = this.EditForm.value as { username: string; email: string };
  const original = this.currentUser!.user;

  const hasName   = !!username && username !== original.username;
  const hasEmail  = !!email    && email    !== original.email;
  const hasAvatar = !!this.avatarFile;

  if (!hasName && !hasEmail && !hasAvatar) return;

  const token = this.currentUser?.token ?? localStorage.getItem('auth_token') ?? '';
  const baseHeaders = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

  let body: any;
  let options = { headers: baseHeaders}; 

  if (hasAvatar) {
    const fd = new FormData();
    if (hasName)  fd.append('username', username);
    if (hasEmail) fd.append('email',    email);
    fd.append('image', this.avatarFile!);
    body = fd;
  } else {
    body = { ...(hasName && { username }), ...(hasEmail && { email }) };
  }
  this.http.put<ProfileUser>(
      `${this.constants.API_ENDPOINT}/api/profile/${uid}`,
      body,
      options
    )
    .pipe(finalize(() => (this.isSaving = false)))
    .subscribe({
  next: (u) => {
    const original = this.currentUser!.user;
    const respUser = (u as any)?.user ?? (u as any) ?? null;

    const updatedUser: ProfileUser = respUser ?? {
      ...original,
      ...(hasName  ? { username } : {}),
      ...(hasEmail ? { email }    : {}),
      ...(hasAvatar && this.avatarPreview ? { img: this.avatarPreview } : {}),
    };

    this.currentUser = { ...(this.currentUser as any), user: updatedUser } as any;
    localStorage.setItem('user', JSON.stringify(this.currentUser));

    this.EditForm.patchValue({
      username: updatedUser.username,
      email:    updatedUser.email,
    });

    if (hasAvatar) {
      this.avatarPreview = updatedUser.img ?? this.avatarPreview;
      this.avatarFile = undefined;
    }

    console.log('Profile updated', updatedUser);
    window.dispatchEvent(new Event('auth-changed'));
    this.cdr.markForCheck();
    this.router.navigate(['/profile-wallet']);

  },
  error: (err) => { console.error('Update profile failed', err); },
});

}}
