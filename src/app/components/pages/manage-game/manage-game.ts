import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { GameTypeRes } from '../../models/res/gameType_res';
import { GetGameTypeRes } from '../../models/res/getGameType_res';
import { GameResponse } from '../../models/res/games_res';
import { GetGameResponse } from '../../models/res/get_games_res';

type Game = {
  id: string;
  title: string;
  price: number;
  category: string;
  dev: string;
  desc: string;
  cover?: string;
};

type ExistingImage = { imgid: number; url: string };

@Component({
  selector: 'app-manage-game',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss']
})
export class ManageGame implements OnInit {
  private readonly base = 'https://game-store-backend-vs08.onrender.com';

  form!: FormGroup;
  CATEGORIES: GameTypeRes[] = [];
  selectedCats: GameTypeRes[] = [];

  games: GameResponse[] = [];

  editingId: number | null = null;

  // ไฟล์ใหม่ + พรีวิว
  droppedFiles: File[] = [];
  filePreviews: (string | null)[] = [];

  // ✅ รูปเดิมจากเซิร์ฟเวอร์ + id ที่จะลบ
  existingImages: ExistingImage[] = [];
  deleteImageIds: number[] = [];

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
      released_at: [this.toDateInputValue(new Date())],
      rank_score: [0],
      files: [null],
      categories: [[] as GameTypeRes[]],
    });
    this.loadTypes();
    this.loadGames();
  }

  private loadTypes() {
    this.http.get<GetGameTypeRes>(`${this.base}/api/game/types`).subscribe(res => {
      this.CATEGORIES = res.data ?? [];
      this.cdr.markForCheck();
    });
  }

  private loadGames() {
    this.http.get<GetGameResponse>(`${this.base}/api/game`).subscribe(res => {
      this.games = res.data ?? [];
      this.cdr.markForCheck();
    });
  }

  private toDateInputValue(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private setNotice(msg: string, type: 'success' | 'error') {
    this.notice = msg;
    this.noticeType = type;
    this.cdr.markForCheck();
    window.setTimeout(() => { this.notice = ''; this.noticeType = ''; this.cdr.markForCheck(); }, 3000);
  }

  // ===== Category =====
  toggleCat(cat: GameTypeRes) {
    const exists = this.selectedCats.some(c => c.tid === cat.tid);
    this.selectedCats = exists ? this.selectedCats.filter(c => c.tid !== cat.tid) : [...this.selectedCats, cat];
    this.form.patchValue({ categories: this.selectedCats });
    this.cdr.markForCheck();
  }
  isSelected = (tid: number) => this.selectedCats.some(c => c.tid === tid);
  removeCat(i: number) {
    this.selectedCats.splice(i, 1);
    this.form.patchValue({ categories: [...this.selectedCats] });
    this.cdr.markForCheck();
  }

  // ===== actions =====
  edit(g: GameResponse) {
    this.editingId = g.gid;

    const cats: GameTypeRes[] = (g.categories ?? []).map(c => ({ tid: c.tid, name: c.category_name }));
    this.selectedCats = cats;

    // ✅ โหลดรูปเดิมมาโชว์เป็นพรีวิว
    this.existingImages = (g.images ?? []).map(img => ({ imgid: img.imgid, url: img.url }));
    this.deleteImageIds = [];

    // ล้างไฟล์ใหม่/พรีวิวเดิม
    this.revokeAllPreviews();
    this.droppedFiles = [];

    this.form.patchValue({
      title: g.name,
      price: Number(g.price),
      categories: cats,
      dev: g.developer,
      desc: g.description,
      files: null
    });

    this.cdr.markForCheck();
  }

  save() {
    if (this.form.invalid || this.isSubmitting) { this.form.markAllAsTouched(); return; }

    const v = this.form.value as any;
    const categoriesCSV = this.selectedCats.map(x => x.tid).join(',');

    const fd = new FormData();
    fd.append('name', String(v.title ?? '').trim());
    fd.append('price', String(v.price ?? 0));
    fd.append('description', String(v.desc ?? '').trim());
    if (v.released_at) fd.append('released_at', String(v.released_at));
    fd.append('developer', String(v.dev ?? '').trim());
    fd.append('categories', categoriesCSV);
    // ✅ รูปที่ถูก mark เพื่อลบ
    if (this.editingId && this.deleteImageIds.length) {
      fd.append('delete_image_ids', this.deleteImageIds.join(','));
    }
    // ไฟล์ใหม่ที่เพิ่ม
    for (const f of this.droppedFiles) fd.append('images', f, f.name);

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.isSubmitting = true;

    const req$ = !this.editingId
      ? this.http.post(`${this.base}/api/game/with-media`, fd, { headers })
      : this.http.put(`${this.base}/api/game/${this.editingId}/with-media`, fd, { headers });

    req$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.setNotice(!this.editingId ? 'เพิ่มเกมเสร็จแล้ว ✅' : 'อัปเดตเกมเสร็จแล้ว ✅', 'success');
        this.clear();
        this.loadGames();
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.isSubmitting = false;
        this.setNotice('บันทึกไม่สำเร็จ ลองอีกครั้ง', 'error');
      }
    });
  }

  // ✅ ลบเกมจริงด้วย DELETE /api/game/:gid
  remove() {
    if (!this.editingId || this.isSubmitting) return;

    // ยืนยันก่อนลบ
    const ok = window.confirm('ยืนยันการลบเกมนี้หรือไม่? การลบจะลบข้อมูลที่เกี่ยวข้องทั้งหมด');
    if (!ok) return;

    const token = localStorage.getItem('token') ?? '';
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;

    this.isSubmitting = true;

    this.http.delete(`${this.base}/api/game/${this.editingId}`, { headers }).subscribe({
      next: (_res: any) => {
        this.isSubmitting = false;
        this.setNotice('ลบเกมสำเร็จ ✅', 'success');
        this.clear();
        this.loadGames();  // รีโหลดให้ตรงกับเซิร์ฟเวอร์
      },
      error: (err) => {
        console.error('DELETE failed:', err);
        this.isSubmitting = false;
        // ถ้ามีข้อความจากเซิร์ฟเวอร์ (เช่น 409 ลบไม่ได้เพราะ FK) ให้แสดง
        const msg = err?.error?.message || 'ลบไม่สำเร็จ ลองอีกครั้ง';
        this.setNotice(msg, 'error');
      }
    });
  }

  clear() {
    this.editingId = null;
    this.selectedCats = [];
    this.existingImages = [];
    this.deleteImageIds = [];

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

    this.revokeAllPreviews();
    this.droppedFiles = [];
    this.cdr.markForCheck();
  }

  // ===== Files (ใหม่ + พรีวิว) =====
  onBrowse(input: HTMLInputElement) { if (!this.isSubmitting) input.click(); }

  private addFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    for (const f of arr) {
      this.droppedFiles.push(f);
      const url = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
      this.filePreviews.push(url);
    }
    this.form.patchValue({ files: this.droppedFiles });
    this.cdr.markForCheck();
  }

  private revokeAllPreviews() {
    for (const url of this.filePreviews) if (url) URL.revokeObjectURL(url);
    this.filePreviews = [];
  }

  onFileInput(ev: Event) {
    const files = (ev.target as HTMLInputElement).files;
    if (!files) return;
    this.addFiles(files);
    (ev.target as HTMLInputElement).value = '';
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    if (!ev.dataTransfer?.files?.length) return;
    this.addFiles(ev.dataTransfer.files);
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }

  // ลบไฟล์ใหม่ทีละไฟล์
  removeFile(i: number) {
    const url = this.filePreviews[i];
    if (url) URL.revokeObjectURL(url);
    this.filePreviews.splice(i, 1);
    this.droppedFiles.splice(i, 1);
    this.form.patchValue({ files: this.droppedFiles });
    this.cdr.markForCheck();
  }

  // ✅ ลบ “รูปเดิม” (mark ไว้ก่อน)
  removeExistingImage(i: number) {
    const removed = this.existingImages.splice(i, 1)[0];
    if (removed) this.deleteImageIds.push(removed.imgid);
    this.cdr.markForCheck();
  }

  // แสดงชื่อไฟล์จาก URL (สำหรับ chip)
  fileNameFromUrl(url: string): string | null {
    try {
      const p = url.split('?')[0];
      const name = p.substring(p.lastIndexOf('/') + 1);
      return decodeURIComponent(name || '');
    } catch { return null; }
  }
}
