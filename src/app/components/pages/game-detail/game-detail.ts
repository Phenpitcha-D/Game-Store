import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { GameResponse } from '../../models/res/games_res';
import { GetOrderResponse } from '../../models/res/getOrder_res';

export interface GetGameResponse {
  success: boolean;
  data: GameResponse;
}

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './game-detail.html',
  styleUrl: './game-detail.scss'
})
export class GameDetail implements OnInit, OnDestroy {
  private readonly base = 'https://game-store-backend-vs08.onrender.com';
  private route = inject(ActivatedRoute);
  private sub?: Subscription;

  gid!: number;
  game?: GameResponse;

  // UI: buy panel
  isBuyOpen = false;
  promoCode = '';
  promoError = '';
  discount = 0;
  applying = false;
  buying = false;
  buyError = '';
  lastPaidOrderId?: number;

  // Fallbacks
  fallbackHero = 'https://picsum.photos/seed/hero/1920/900';
  galleryFallback = [
    'https://picsum.photos/seed/ss1/960/540',
    'https://picsum.photos/seed/ss2/960/540'
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      this.gid = Number(params.get('gid'));
      if (Number.isFinite(this.gid)) this.loadGame();
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  // === Getters ===
  get heroSrc(): string {
    return (this.game?.images?.[0]?.url) ?? this.fallbackHero;
  }
  get gallerySrcs(): string[] {
  const imgs = this.game?.images ?? [];
  return imgs.length > 1
    ? imgs.slice(1).map(i => i.url)
    : imgs.map(i => i.url).length ? [] : this.galleryFallback;
}

  get priceNumber(): number {
    return Number(this.game?.price ?? 0);
  }
  get total(): number {
    const t = this.priceNumber - (this.discount || 0);
    return t > 0 ? t : 0;
  }

  // === Helpers ===
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  // === API ===
  loadGame() {
    const url = `${this.base}/api/game/${this.gid}`;
    this.http.get<GetGameResponse>(url).subscribe({
      next: (res) => {
        this.game = res.data;
        // รีเซ็ตสถานะซื้อ
        this.discount = 0;
        this.promoCode = '';
        this.promoError = '';
        this.isBuyOpen = false;
        this.buyError = '';
        this.cdr.markForCheck();
      },
      error: (err) => console.error('loadGame error', err)
    });
  }

  // === Actions ===
  addToCart(g: GameResponse) {
    const token = localStorage.getItem('token') ?? '';
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    const url = `${this.base}/api/order`
    var oid = 0;
    this.http.post<GetOrderResponse>(url, null, { headers }).pipe(
      map(res => res.order.oid),

      switchMap(oid =>
        this.http.post(`${this.base}/api/order/${oid}/items`, { gid: g.gid }, { headers })
      ),
    ).subscribe({
      next: () => {
        window.dispatchEvent(new CustomEvent('cart-changed'));
        localStorage.setItem('cart-updated', Date.now().toString());
      },
      error: (err) => console.error('addToCart error:', err),
    });
  }
  toggleBuy() { this.isBuyOpen = !this.isBuyOpen; }

  applyPromo() {
    // ไม่ต้องคำนวณจริงที่ฝั่ง client เพราะฝั่ง server จะเป็นผู้ตัดสิน
    // ตรงนี้คงไว้แบบ light hint (จะลบออกก็ได้)
    this.promoError = '';
    const code = (this.promoCode || '').trim();
    if (!code) { this.discount = 0; return; }

    this.applying = true;
    setTimeout(() => {
      // แสดงลดคร่าว ๆ (optional)
      if (code.toUpperCase() === 'WELCOME10') {
        this.discount = Math.floor(this.priceNumber * 0.10);
      } else if (code.toUpperCase() === 'GAME200') {
        this.discount = Math.min(200, this.priceNumber);
      } else {
        this.discount = 0;
        // ไม่ฟันธงว่า invalid จนกว่าจะยิงซื้อจริง
        // this.promoError = 'Unknown code (validated on payment)';
      }
      this.applying = false;
    }, 150);
  }

  clearPromo() {
    this.promoCode = '';
    this.promoError = '';
    this.discount = 0;
  }

  /** ซื้อทันที: เรียก POST /api/orders/buy-now   body: { games: [gid], promoCode? } */
  buyConfirm() {
    if (!this.gid) return;
    this.buyError = '';
    this.buying = true;

    const url = `${this.base}/api/order/buy`;
    const body: any = { games: [this.gid] };
    const code = (this.promoCode || '').trim();
    if (code) body.promoCode = code;

    this.http.post<any>(url, body, { headers: this.getAuthHeaders() }).subscribe({
      next: (res) => {
        this.buying = false;

        if (!res?.success) {
          this.buyError = res?.message || 'Purchase failed';
          return;
        }

        // ซื้อสำเร็จ
        this.lastPaidOrderId = res?.order?.oid;
        this.isBuyOpen = false;

        window.dispatchEvent(new CustomEvent('wallet-changed'));
        window.dispatchEvent(new CustomEvent('auth-changed'));


        // รีเฟรชข้อมูลเกม (กันราคา/สต็อก/ฯลฯ เปลี่ยน)
        this.loadGame();

        // แจ้งผู้ใช้ (จะใช้ toast ของคุณแทนได้)
        const charged = res?.charged ?? res?.order?.total_after;
        alert(`✅ ซื้อสำเร็จ #${this.lastPaidOrderId} ชำระ ${charged} บาท`);
      },
      error: (err) => {
        this.buying = false;
        const msg = err?.error?.message || err?.message || 'Purchase error';
        this.buyError = msg;
        // ถ้า server ส่ง invalid promo มาก็ขึ้นที่นี่
        if (/promo|โค้ด|invalid/i.test(String(msg))) this.promoError = msg;
        console.error('buyConfirm error', err);
      }
    });
  }
}
