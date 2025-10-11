import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, map, of, switchMap, tap, finalize, debounceTime, distinctUntilChanged, startWith, Subscription } from 'rxjs';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { GetGameResponse } from '../../models/res/get_games_res';
import { GameResponse } from '../../models/res/games_res';
import { GetGameImageResponse } from '../../models/res/get_gameImg_res';
import { GameCategoryRes } from '../../models/res/get_game_category_res';
import { GetGameTypeRes } from '../../models/res/getGameType_res';
import { GameTypeRes } from '../../models/res/gameType_res';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  // Base URL (เปลี่ยนเป็น environment.baseUrl ได้)
  private readonly base = 'https://game-store-backend-vs08.onrender.com';

  imgCache = new Map<number, string>();
  topgame: GameResponse | undefined;
  games: GameResponse[] = [];
  gamesFilted: GameResponse[] = [];
  imgUrl: string | undefined;

  CATEGORIES: GameTypeRes[] = [];
  selectedTypeId: number | 'all' = 'all';

  // สำหรับ *ngFor
  trackByGid = (_: number, g: GameResponse) => g.gid;
  trackByType = (_: number, t: any) => this.getTypeId(t) ?? this.getTypeName(t);

  // === สถานะโหลด/ข้อผิดพลาด ===
  isLoading = true;
  isLoadingCategories = false;
  hasError = false;

  // === Search ===
  gameSearch = new FormControl<string>('', { nonNullable: true });
  private searchTerm = '';
  private subs = new Subscription();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // subscribe ช่องค้นหา (debounce ป้องกันกระพือ)
    const s = this.gameSearch.valueChanges
      .pipe(
        startWith(this.gameSearch.value ?? ''),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.searchTerm = this.normalize(term || '');
        this.applyFilters();
      });
    this.subs.add(s);

    this.callApi();
    this.loadTypes();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private buildCategoryRequests() {
    return this.games.map(g =>
      this.http
        .get<GameCategoryRes>(`${this.base}/api/game/${g.gid}/categories`)
        .pipe(map(res => ({ gid: g.gid, cats: res?.categories ?? [] })))
    );
  }

  callApi() {
    this.isLoading = true;
    this.hasError = false;

    const url = `${this.base}/api/game/`;

    this.http
      .get<GetGameResponse>(url)
      .pipe(
        tap((raw) => {
          this.games = raw?.data ?? [];
          this.gamesFilted = this.games;
          this.topgame = this.games.find(g => Number(g.rank_score) === 1);
          this.isLoadingCategories = this.games.length > 0;
        }),
        switchMap(() => {
          if (!this.games.length) return of([]);      // ไม่มีเกม: ข้ามการโหลดหมวดหมู่
          return forkJoin(this.buildCategoryRequests());
        }),
        tap((pairs: any[]) => {
          // map ด้วย gid เพื่อกัน index เพี้ยน
          const byId = new Map<number, any[]>();
          pairs.forEach(p => byId.set(p.gid, p.cats));
          this.games.forEach(g => (g.categories = byId.get(g.gid) ?? []));
        }),
        catchError(err => {
          console.error('❌ GET /api/game failed:', err);
          this.hasError = true;
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
          this.isLoadingCategories = false;
          this.applyFilters();            // ✅ ให้ผลลัพธ์ตรงกับ search + category ปัจจุบัน
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }

  private loadTypes() {
    this.http.get<GetGameTypeRes>(`${this.base}/api/game/types`).subscribe({
      next: (res) => {
        this.CATEGORIES = res.data ?? [];
        this.cdr.markForCheck();
      },
      error: (e) => console.warn('⚠️ load types failed', e),
    });
  }

  toPrice(g: GameResponse): number {
    return Number(g.price ?? 0);
  }

  addToCart(g: GameResponse) {
    // TODO: เชื่อมต่อ cart service/endpoint
    console.log('Add to cart:', g.gid, g.name);
  }

  getCardImage(g: GameResponse): string {
    // ถ้ามี cache แล้ว — ใช้เลย
    const cached = this.imgCache.get(g.gid);
    if (cached) return cached;

    // โหลดครั้งแรก: ให้ fallback ก่อน แล้วค่อยอัปเดตรูปจริงเมื่อมาถึง
    const fallback = `https://youngnails.com.au/wp-content/uploads/2021/11/IMAGE-COMING-SOON-1000.jpg`;
    const url = `${this.base}/api/game/${g.gid}/images`;

    this.http.get<GetGameImageResponse>(url).subscribe({
      next: (raw) => {
        const img = raw?.images?.[0]?.url || fallback;
        this.imgCache.set(g.gid, img);
        this.cdr.markForCheck();
      },
      error: () => {
        this.imgCache.set(g.gid, fallback);
        this.cdr.markForCheck();
      },
    });

    return fallback;
  }

  // --- เลือกประเภท ---
  selectType(tid: number | 'all') {
    this.selectedTypeId = tid;
    this.applyFilters();
  }

  // --- กรองรายการเกมตามประเภท + ชื่อเกม ---
  private applyFilters() {
    let list = this.games ?? [];

    // กรองตามประเภท (มีอยู่เดิม)
    if (this.selectedTypeId !== 'all') {
      const selId = this.selectedTypeId as number;
      const selName = this.normalize(this.getTypeNameById(selId) ?? '');

      list = list.filter(g => {
        const cats: any[] = g?.categories ?? [];
        return cats.some(c => {
          const cid = this.getCatId(c);
          if (cid != null) return cid === selId; // กรณี API ส่ง tid/id
          // fallback: เทียบชื่อ (กันกรณีได้แต่ชื่อ)
          const cname = this.normalize(this.getCatName(c));
          return selName && cname === selName;
        });
      });
    }

    // กรองตามชื่อเกม (ใหม่)
    const term = this.searchTerm;
    if (term) {
      list = list.filter(g => this.normalize(g?.name || '').includes(term));
    }

    this.gamesFilted = list;
    this.cdr.markForCheck();
  }

  // ---------- helpers ----------
  getTypeId(t: any): number {
    return typeof t?.tid === 'number'
      ? t.tid
      : (typeof t?.id === 'number' ? t.id : -1);
  }

  getTypeName(t: any): string {
    return t?.type_name ?? t?.category_name ?? t?.name ?? '';
  }

  getTypeNameById(id: number): string | null {
    const x = this.CATEGORIES.find(it => this.getTypeId(it) === id);
    return x ? this.getTypeName(x) : null;
  }

  getCatId(c: any): number | null {
    return typeof c?.tid === 'number'
      ? c.tid
      : (typeof c?.id === 'number' ? c.id : null);
  }

  getCatName(c: any): string {
    return c?.category_name ?? c?.type_name ?? c?.name ?? '';
  }

  normalize(s: string): string {
    return (s || '').toString().trim().toLowerCase();
  }
}
