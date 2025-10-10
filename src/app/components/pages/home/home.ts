import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GetGameResponse } from '../../models/res/get_games_res';
import { GameResponse } from '../../models/res/games_res';
import { CommonModule } from '@angular/common';
import { GetGameImageResponse } from '../../models/res/get_gameImg_res';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { GameCategoryRes } from '../../models/res/get_game_category_res';
import { GetGameTypeRes } from '../../models/res/getGameType_res';
import { GameTypeRes } from '../../models/res/gameType_res';


@Component({
  selector: 'app-home',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  // Base URL (เปลี่ยนเป็น environment.baseUrl ได้)
  private readonly base = 'https://game-store-backend-vs08.onrender.com';
  imgCache = new Map<number, string>();
  topgame: GameResponse | undefined;
  games: GameResponse[] = [];
  gamesFilted: GameResponse[] = [];
  trackByGid = (_: number, g: GameResponse) => g.gid;
  imgUrl: string | undefined
  CATEGORIES: GameTypeRes[] = [];
  selectedTypeId: number | 'all' = 'all';
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,) { }
  ngOnInit(): void {
    console.log('Start');
    this.callApi();
    this.loadTypes();
  }

  callApi() {
    const url = `${this.base}/api/game/`;

    this.http.get<GetGameResponse>(url).pipe(
      tap((raw) => {
        this.games = raw?.data ?? [];
        this.gamesFilted = this.games;
        this.topgame = this.games.find(g => Number(g.rank_score) === 1);
      }),
      switchMap(() => {
        // รวมทุก API category เป็น array ของ observable
        const categoryRequests = this.games.map(g =>
          this.http.get<GameCategoryRes>(`${this.base}/api/game/${g.gid}/categories`)
        );
        // รวมทั้งหมดรันพร้อมกัน
        return forkJoin(categoryRequests);
      })
    ).subscribe({
      next: (categoriesArray) => {
        // จัดการ category ให้ตรงกับแต่ละเกม
        categoriesArray.forEach((cat, i) => {
          this.games[i].categories = cat.categories;
        });


        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('❌ GET /api/game failed:', err);
      },
    });
  }

  private loadTypes() {
      this.http.get<GetGameTypeRes>(`${this.base}/api/game/types`).subscribe(res => {
        this.CATEGORIES = res.data ?? [];
        this.cdr.markForCheck();
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
    if (this.imgCache.has(g.gid)) {
      return this.imgCache.get(g.gid)!;
    }

    // ถ้ายังไม่มี — โหลดจาก backend
    const fallback = `https://picsum.photos/seed/${g.gid}/960/540`;
    const url = `${this.base}/api/game/${g.gid}/images`;

    this.http.get<GetGameImageResponse>(url).subscribe({
      next: (raw) => {
        const img = raw?.images?.[0]?.url || fallback;
        this.imgCache.set(g.gid, img);
      },
      error: () => {
        this.imgCache.set(g.gid, fallback);
      },
    });

    // ระหว่างรอโหลดครั้งแรก → ใช้ fallback
    return fallback;
  }


  // --- เลือกประเภท ---
selectType(tid: number | 'all') {
  this.selectedTypeId = tid;
  this.applyFilters();
}

// --- กรองรายการเกมตามประเภทที่เลือก (และจะต่อยอดรวม keyword ได้) ---
private applyFilters() {
  let list = this.games ?? [];

  if (this.selectedTypeId !== 'all') {
    const selId = this.selectedTypeId as number;
    const selName = this.normalize(this.getTypeNameById(selId) ?? '');

    list = list.filter(g => {
      const cats: any[] = g?.categories ?? [];
      return cats.some(c => {
        const cid = this.getCatId(c);
        if (cid != null) return cid === selId; // กรณี API ใส่ tid/id มากับเกม
        // fallback: เทียบชื่อ (กันกรณีได้แต่ชื่อ)
        const cname = this.normalize(this.getCatName(c));
        return selName && cname === selName;
      });
    });
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

// สำหรับ *ngFor trackBy
trackByType = (_: number, t: any) => this.getTypeId(t) ?? this.getTypeName(t);
}