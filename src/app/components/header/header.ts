import { ChangeDetectorRef, Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Convert, UserLoginRespon } from '../models/res/user_login_res';


export interface CartItemrResponse {
  success: boolean;
  data: Datum[];
}

export interface Datum {
  oid: number;
  status: string;
  total_before: string;
  total_after: string;
  created_at: string;
  paid_at: null;
  pid: null;
  items_count: number;
}


@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() cartCount = 0;
  currentUser?: UserLoginRespon;
  defaultAvatar =
    'https://st4.depositphotos.com/14953852/22772/v/450/depositphotos_227725020-stock-illustration-image-available-icon-flat-vector.jpg';
  isProfileOpen = false;

  private base = 'https://game-store-backend-vs08.onrender.com';

  constructor(private router: Router, private cdr: ChangeDetectorRef, private http: HttpClient) { }

  ngOnInit(): void {
    this.loadUser();
    this.loadCart();

    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged);
    window.addEventListener('cart-changed', this.onCartChanged); // ✅ ฟัง event ตะกร้า
  }

  ngOnDestroy(): void {
    window.removeEventListener('auth-changed', this.onAuthChanged);
    window.removeEventListener('storage', this.onAuthChanged);
    window.removeEventListener('cart-changed', this.onCartChanged);
  }

  /** เมื่อ user เปลี่ยน */
  private onAuthChanged = () => {
    this.loadUser();
    this.cdr.markForCheck();
  };

  /** เมื่อ cart มีการเปลี่ยน */
  private onCartChanged = () => {
    this.loadCart();
  };

  /** โหลดข้อมูล user จาก localStorage */
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

  /** โหลดจำนวนสินค้าในตะกร้า */
  private loadCart() {
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.http.get<CartItemrResponse>(
      `${this.base}/api/order?status=DRAFT`,
      { headers }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.cartCount = res.data[0].items_count;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('⚠️ loadCart failed:', err)
    });
  }

  // --------------- UI functions ----------------

  goTo(path: string): void { this.router.navigate([path]); }
  signIn(): void { this.router.navigate(['/login']); }
  signOut(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');       // ถ้าใช้ชื่ออื่นเช่น auth_token ใส่ด้วย
    localStorage.removeItem('auth_token');

    this.cartCount = 0;                     // ✅ รีเซ็ตเลขทันที
    window.dispatchEvent(new CustomEvent('auth-changed'));
    window.dispatchEvent(new CustomEvent('cart-changed')); // อัปเดตแท็บปัจจุบัน
    this.closeProfileMenu();
    this.router.navigate(['/login']);
  }
  onImgError(ev: Event) { (ev.target as HTMLImageElement).src = this.defaultAvatar; }
  toggleProfileMenu() { this.isProfileOpen = !this.isProfileOpen; }
  closeProfileMenu() { this.isProfileOpen = false; }
  @HostListener('document:click') onDocClick() { this.isProfileOpen = false; }
  @HostListener('document:keydown.escape') onEsc() { this.isProfileOpen = false; }
}
