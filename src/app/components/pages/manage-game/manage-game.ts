import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { GameTypeRes } from '../../models/res/gameType_res';
import { GetGameTypeRes } from '../../models/res/getGameType_res';

type Game = {
  id: string;
  title: string;
  price: number;
  category: string;
  dev: string;
  desc: string;
  cover?: string;
};

@Component({
  selector: 'app-manage-game',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss']
})
export class ManageGame implements OnInit {
  private readonly base = 'http://localhost:3000';

  form!: FormGroup;
  CATEGORIES: GameTypeRes[] = [];
  selectedCats: GameTypeRes[] = [];

  games: Game[] = [
    { id: 'nightfall', title: 'Nightfall Protocol', price: 399, category: 'Action', dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'chrono',   title: 'Chrono Rift',        price: 599, category: 'RPG',    dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'mechx',    title: 'Mech Arena X',       price: 799, category: 'Indie',  dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'nebula',   title: 'Nebula Drifters',    price: 899, category: 'Strategy', dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'citadel',  title: 'Citadel Forge',      price: 329, category: 'Adventure', dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'echoes',   title: 'Echoes of Avalon',   price: 399, category: 'Sports', dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
  ];

  editingId: string | null = null;        // โหมดแก้ไขรายการ mock
  droppedFiles: File[] = [];

  // UI state
  isSubmitting = false;
  notice = '';
  noticeType: 'success' | 'error' | '' = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      price: [0, [Validators.required, Validators.min(0)]],
      dev: [''],
      desc: [''],
      // ใช้เป็นวันที่ปัจจุบัน (YYYY-MM-DD) ให้สอดคล้องกับตัวอย่าง Postman
      released_at: [this.toDateInputValue(new Date())],
      rank_score: [0],
      files: [null],
    });
    this.loadTypes();
  }

  private loadTypes() {
    this.http.get<GetGameTypeRes>(`${this.base}/api/game/types`).subscribe(res => {
      this.CATEGORIES = res.data ?? [];
      this.cdr.markForCheck();
    });
  }

  // ===== Helpers =====
  private toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // "YYYY-MM-DD"
  }

  private setNotice(msg: string, type: 'success' | 'error') {
    this.notice = msg;
    this.noticeType = type;
    this.cdr.markForCheck();
    // auto hide after 3 seconds
    window.setTimeout(() => {
      this.notice = '';
      this.noticeType = '';
      this.cdr.markForCheck();
    }, 3000);
  }

  // ===== Category =====
  toggleCat(cat: GameTypeRes) {
    if (this.selectedCats.includes(cat)) {
      this.selectedCats = this.selectedCats.filter(c => c !== cat);
    } else {
      this.selectedCats = [...this.selectedCats, cat];
    }
    this.form.patchValue({ categories: this.selectedCats });
    this.cdr.markForCheck();
  }

  removeCat(i: number) {
    this.selectedCats.splice(i, 1);
    this.form.patchValue({ categories: [...this.selectedCats] });
    this.cdr.markForCheck();
  }

  // ===== actions =====
  edit(g: Game) {
    this.editingId = g.id;

    // mock: แปลงชื่อ category ในแถว → array string (เพื่อโชว์เฉยๆ)
    const cats = Array.isArray((g as any).categories)
      ? (g as any).categories as string[]
      : (g.category ? g.category.split('/').map(s => s.trim()).filter(Boolean) : []);

    this.form.patchValue({
      title: g.title,
      price: g.price,
      categories: cats,
      dev: g.dev,
      desc: g.desc,
      files: null
    });
    this.droppedFiles = [];
    this.cdr.markForCheck();
  }

  save() {
    if (this.form.invalid || this.isSubmitting) { this.form.markAllAsTouched(); return; }

    const v = this.form.value as any;

    // ถ้าเป็นโหมด "Add" → ยิง API และรอจนสำเร็จ
    if (!this.editingId) {
      this.isSubmitting = true;

      const categoriesCSV = this.selectedCats.map(x => x.tid).join(',');
      const fd = new FormData();
      fd.append('name', String(v.title ?? '').trim());
      fd.append('price', String(v.price ?? 0));
      fd.append('description', String(v.desc ?? '').trim());
      if (v.released_at) fd.append('released_at', String(v.released_at)); // "YYYY-MM-DD"
      fd.append('developer', String(v.dev ?? '').trim());
      fd.append('rank_score', String(v.rank_score ?? 0));
      fd.append('categories', categoriesCSV);

      for (const f of this.droppedFiles) {
        fd.append('images', f, f.name); // field name = "images"
      }

      const token = localStorage.getItem('token') ?? '';
      const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

      this.http.post(`${this.base}/api/game/with-media`, fd, { headers }).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.setNotice('เพิ่มเกมเสร็จแล้ว ✅', 'success');
          this.clear(); // รีเซ็ตฟอร์มหลังสำเร็จ
        },
        error: (err) => {
          console.error('POST /api/game/with-media failed:', err);
          this.isSubmitting = false;
          this.setNotice('เพิ่มเกมไม่สำเร็จ ลองอีกครั้ง', 'error');
        }
      });
      return;
    }

    // โหมด "Save" (แก้ไข mock list เดิมในหน้า) ไม่ยิง API เพื่อไม่กระทบของเดิม
    const categoryString = (v.categories as string[] ?? []).join(' / ');
    const idx = this.games.findIndex(x => x.id === this.editingId);
    if (idx >= 0) this.games[idx] = { ...this.games[idx], ...v, category: categoryString };
    this.setNotice('บันทึกเสร็จแล้ว ✅', 'success');
    this.clear();
  }

  remove() {
    if (!this.editingId) return;
    this.games = this.games.filter(g => g.id !== this.editingId);
    this.setNotice('ลบรายการแล้ว', 'success');
    this.clear();
  }

  clear() {
    this.editingId = null;
    this.selectedCats = [];
    this.form.reset({
      title: '',
      price: 599,
      categories: [],
      dev: '',
      desc: '',
      released_at: this.toDateInputValue(new Date()),
      rank_score: 0,
      files: null
    });
    this.droppedFiles = [];
    this.cdr.markForCheck();
  }

  // ===== Files =====
  onBrowse(input: HTMLInputElement) { if (!this.isSubmitting) input.click(); }
  onFileInput(ev: Event) {
    const files = (ev.target as HTMLInputElement).files;
    if (!files) return;
    this.droppedFiles = [...this.droppedFiles, ...Array.from(files)];
    this.form.patchValue({ files: this.droppedFiles });
    this.cdr.markForCheck();
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    if (!ev.dataTransfer?.files?.length) return;
    this.droppedFiles = [...this.droppedFiles, ...Array.from(ev.dataTransfer.files)];
    this.form.patchValue({ files: this.droppedFiles });
    this.cdr.markForCheck();
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }
  removeFile(i: number) {
    this.droppedFiles.splice(i, 1);
    this.form.patchValue({ files: this.droppedFiles });
    this.cdr.markForCheck();
  }
}
