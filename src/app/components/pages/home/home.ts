import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GetGameResponse } from '../../models/res/get_games_res';
import { GameResponse } from '../../models/res/games_res';
import { CommonModule } from '@angular/common';
import { GetGameImageResponse } from '../../models/res/get_gameImg_res';

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
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef,) { }
  ngOnInit(): void {
    console.log('Start');
    this.callApi();
  }

  callApi() {
    const url = `${this.base}/api/game/`;
    this.http.get<GetGameResponse>(url).subscribe({
      next: (raw) => {
        this.games = raw?.data ?? [];
        this.gamesFilted = this.games;
        this.topgame = this.games.find(g => Number(g.rank_score) === 1);

        console.log('Loaded games:', this.games);
        console.log('Topgame:', this.topgame);

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('GET /api/game failed:', err);
      },
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
}