import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Convert, UserLoginRespon } from '../models/user_login_res';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  /** จำนวนสินค้าในตะกร้า (โชว์บน badge) */
  @Input() cartCount = 2;
  currentUser: UserLoginRespon | undefined;

  private onAuthChanged = () => {
    this.loadUser();
    this.cdr.markForCheck();
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUser();
    // ฟังเหตุการณ์เปลี่ยนสถานะล็อกอินจากทุกที่
    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged); // เผื่อหลายแท็บ
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
      this.currentUser = undefined;
    }
  }

  /** ใช้กับปุ่ม cart หรือเมนูที่อยากสั่งนำทางด้วยโค้ด */
  goTo(path: string): void {
    this.router.navigate([path]);
  }

  /** ทางลัดสำหรับปุ่ม Sign In (หากอยากใช้คลิกเรียกแทน routerLink) */
  signIn(): void {
    this.router.navigate(['/login']);
  }

  signOut(): void {
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth-changed'));
    this.router.navigate(['/login']);
  }
}
