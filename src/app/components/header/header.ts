import { ChangeDetectorRef, Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Convert, UserLoginRespon } from '../models/res/user_login_res';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss', // คงรูปแบบเดิมของโปรเจกต์คุณ
})
export class Header {
  /** จำนวนสินค้าในตะกร้า (โชว์บน badge) */
  @Input() cartCount = 2;

  currentUser: UserLoginRespon | undefined;

  /** ใช้รูป fallback เมื่อ user.img ว่าง/null/โหลดไม่ได้ */
  defaultAvatar =
    'https://st4.depositphotos.com/14953852/22772/v/450/depositphotos_227725020-stock-illustration-image-available-icon-flat-vector.jpg';

  /** เปิด/ปิดป๊อปโอเวอร์โปรไฟล์ */
  isProfileOpen = false;

  private onAuthChanged = () => {
    this.loadUser();
    this.cdr.markForCheck();
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUser();
    // ฟังเหตุการณ์เปลี่ยนสถานะล็อกอินจากทุกที่/หลายแท็บ
    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged);
  }

  ngOnDestroy(): void {
    window.removeEventListener('auth-changed', this.onAuthChanged);
    window.removeEventListener('storage', this.onAuthChanged);
  }

  private loadUser() {
    this.currentUser = undefined;
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      this.currentUser = Convert.toUserLoginRespon(raw);
    } catch {
      // ถ้า schema ไม่ตรงก็ไม่ตั้งค่าเพื่อกันพัง
      this.currentUser = undefined;
    }
  }

  /** ใช้กับปุ่ม cart หรือเมนูที่อยากสั่งนำทางด้วยโค้ด */
  goTo(path: string): void {
    this.router.navigate([path]);
  }

  signIn(): void {
    this.router.navigate(['/login']);
  }

  signOut(): void {
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth-changed'));
    this.closeProfileMenu();
    this.router.navigate(['/login']);
  }

  /** Avatar error → ใช้ fallback */
  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.defaultAvatar;
  }

  /** Toggle/close เมนูโปรไฟล์ */
  toggleProfileMenu() {
    this.isProfileOpen = !this.isProfileOpen;
  }
  closeProfileMenu() {
    this.isProfileOpen = false;
  }

  /** ปิดเมื่อคลิกนอก */
  @HostListener('document:click')
  onDocClick() {
    this.isProfileOpen = false;
  }

  /** ปิดเมื่อกด ESC */
  @HostListener('document:keydown.escape')
  onEsc() {
    this.isProfileOpen = false;
  }
}
