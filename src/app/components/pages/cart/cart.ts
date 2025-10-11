import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

interface DraftOrderRes {
  success: boolean;
  data: DraftOrder[];
}

interface DraftOrder {
  oid: number;
  status: string;
  total_before: string;
  total_after: string;
  created_at: string;
  items_count: number;
}

interface OrderDetailRes {
  success: boolean;
  order: {
    oid: number;
    uid: number;
    status: string;
    total_before: string;
    total_after: string;
    created_at: string;
    pid?: number | null;
  };
  items: Item[];
}

interface Item {
  gid: number;
  unit_price: string;
  name: string;
  image?: string;
  price?: number;
  genre?: string;
}

@Component({
  selector: 'app-cart',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
  private readonly base = 'https://game-store-backend-vs08.onrender.com';
  cartItems: Item[] = [];
  totalBefore = 0;
  totalAfter = 0;
  get discount(): number {
    return Math.max(0, this.totalBefore - this.totalAfter);
  }

  oid?: number;
  promoCode = new FormControl<string>('', { nonNullable: true });
  isApplied = false;
  isLoading = true;
  hasError = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadDraftOrder();
  }

  private get headers() {
    const token = localStorage.getItem('token') ?? '';
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  }

  /** โหลด order draft */
  loadDraftOrder() {
    this.isLoading = true;
    this.http.get<DraftOrderRes>(`${this.base}/api/order?status=DRAFT`, { headers: this.headers })
      .subscribe({
        next: (res) => {
          if (res.success && res.data.length > 0) {
            const draft = res.data[0];
            this.oid = draft.oid;
            this.loadOrderDetail(draft.oid);
          } else {
            this.cartItems = [];
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('❌ Failed to load draft orders:', err);
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  /** โหลดรายละเอียด order draft */
  private loadOrderDetail(oid: number) {
    this.http.get<OrderDetailRes>(`${this.base}/api/order/${oid}`, { headers: this.headers })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.totalBefore = Number(res.order.total_before);
            this.totalAfter = Number(res.order.total_after);
            this.isApplied = !!res.order.pid;
            this.cartItems = res.items.map(i => ({
              ...i,
              price: Number(i.unit_price),
            }));
            this.cartItems.forEach(item => this.loadGameDetail(item));
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('❌ Failed to load order detail:', err);
          this.hasError = true;
          this.isLoading = false;
        },
      });
  }

  /** โหลดข้อมูลเกมเพิ่มเติม */
  private loadGameDetail(item: Item) {
    this.http.get<any>(`${this.base}/api/game/${item.gid}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const g = res.data;
          item.image = g.images?.[0]?.url || 'https://youngnails.com.au/wp-content/uploads/2021/11/IMAGE-COMING-SOON-1000.jpg';
          item.genre = g.categories?.map((c: any) => c.category_name).join(', ');
        }
        this.cdr.markForCheck();
      }
    });
  }

  /** APPLY PROMO CODE */
  applyPromo() {
    if (!this.oid) return;
    const code = this.promoCode.value?.trim();
    if (!code) {
      alert('กรุณากรอกรหัสโปรโมชัน');
      return;
    }

    this.http.post(`${this.base}/api/order/${this.oid}/apply-promo`, { code }, { headers: this.headers })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.isApplied = true;
            this.recalculate();
          } else alert(res.message || 'ใช้โปรโมชันไม่สำเร็จ');
        },
        error: (err) => console.error('❌ Apply promo failed:', err),
      });
  }

  /** CLEAR PROMO CODE */
  clearPromo() {
    if (!this.oid) return;

    this.http.post(`${this.base}/api/order/${this.oid}/clear-promo`, {}, { headers: this.headers })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.isApplied = false;
            this.promoCode.setValue('');
            this.recalculate();
          } else alert('ล้างโปรโมชันไม่สำเร็จ');
        },
        error: (err) => console.error('❌ Clear promo failed:', err),
      });
  }

  /** RECALCULATE TOTAL */
  private recalculate() {
    if (!this.oid) return;

    this.http.post(`${this.base}/api/order/${this.oid}/recalculate`, {}, { headers: this.headers })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.totalBefore = Number(res.order.total_before);
            this.totalAfter = Number(res.order.total_after);
            this.cdr.markForCheck();
          }
        },
        error: (err) => console.error('❌ Recalculate failed:', err),
      });
  }

  /** BUY ORDER */
  buyOrder() {
    if (!this.oid) return;
    const confirmBuy = confirm('ยืนยันการซื้อสินค้านี้หรือไม่?');
    if (!confirmBuy) return;

    this.http.post(`${this.base}/api/order/${this.oid}/pay`, {}, { headers: this.headers })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('ซื้อสำเร็จ!');
            window.dispatchEvent(new CustomEvent('wallet-changed'));
            window.dispatchEvent(new CustomEvent('auth-changed'));
            window.dispatchEvent(new CustomEvent('cart-changed'));
            window.dispatchEvent(new CustomEvent('order-paid'));
            this.cdr.detectChanges();
            this.cartItems = [];
            this.totalBefore = this.totalAfter = 0;
          } else alert(res.message || 'ซื้อไม่สำเร็จ');
        },
        error: (err) => console.error('❌ Buy failed:', err),
      });
  }

  /** ลบสินค้า */
  removeItem(item: Item) {
    if (!this.oid) return;
    if (!confirm(`ลบ "${item.name}" ออกจากรถเข็น?`)) return;

    this.http.delete(`${this.base}/api/order/${this.oid}/items/${item.gid}`, { headers: this.headers })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.cartItems = this.cartItems.filter(i => i.gid !== item.gid);
            this.totalBefore = this.cartItems.reduce((sum, i) => sum + (i.price || 0), 0);
            this.totalAfter = this.totalBefore;
            window.dispatchEvent(new CustomEvent('cart-changed'));
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('❌ Remove item failed:', err);
          alert('Failed to remove item.');
        }
      });
  }

  trackCart(_: number, item: Item) {
    return item.gid;
  }
}
