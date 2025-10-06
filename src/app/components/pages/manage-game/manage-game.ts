import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, ReactiveFormsModule],      
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss']                
})
export class ManageGame implements OnInit {
  form!: FormGroup;
  selectedCats: string[] = [];

  CATEGORIES: string[] = [
  'Action','RPG','Adventure','Indie','Strategy','Sports','Racing',
  'Simulation','Horror','Puzzle','Shooter','Fighting','MMO','Sandbox','Survival'
];

  games: Game[] = [
    { id: 'nightfall', title: 'Nightfall Protocol', price: 399, category: 'Action',    dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'chrono',    title: 'Chrono Rift',        price: 599, category: 'RPG',       dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'mechx',     title: 'Mech Arena X',       price: 799, category: 'Indie',     dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'nebula',    title: 'Nebula Drifters',    price: 899, category: 'Strategy',  dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'citadel',   title: 'Citadel Forge',      price: 329, category: 'Adventure', dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
    { id: 'echoes',    title: 'Echoes of Avalon',   price: 399, category: 'Sports',    dev: '—', desc: '', cover: 'https://i.ytimg.com/vi/GFLoRTwPtic/maxresdefault.jpg' },
  ];
  editingId: string | null = null;
  droppedFiles: File[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      price: [599, [Validators.required, Validators.min(0)]],
      categories: [[] as string[]],
      dev: [''],
      desc: [''],
      files: [null],
    });
  }

  toggleCat(cat: string) {
  if (this.selectedCats.includes(cat)) {
    this.selectedCats = this.selectedCats.filter(c => c !== cat);
  } else {
    this.selectedCats = [...this.selectedCats, cat];
  }
  this.form.patchValue({ categories: this.selectedCats });
}

  removeCat(i: number) {
    this.selectedCats.splice(i, 1);
    this.form.patchValue({ categories: [...this.selectedCats] });
  }


  // ===== actions =====
  edit(g: Game) {
  this.editingId = g.id;

  // รองรับทั้ง string เดี่ยว และ array เดิม
  const cats = Array.isArray((g as any).categories)
    ? (g as any).categories as string[]
    : (g.category ? g.category.split('/').map(s => s.trim()).filter(Boolean) : []);

  this.selectedCats = cats;
  this.form.patchValue({
    title: g.title,
    price: g.price,
    categories: cats,
    dev: g.dev,
    desc: g.desc
  });
  this.droppedFiles = [];
}


  save() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  const v = this.form.value as any;

  // แปลง array → string เพื่อเก็บในโมเดลเดิม/ยิง API
  const categoryString = (v.categories as string[]).join(' / ');

  if (this.editingId) {
    const idx = this.games.findIndex(x => x.id === this.editingId);
    if (idx >= 0) this.games[idx] = { ...this.games[idx], ...v, category: categoryString };
  } else {
    const id = v.title.toLowerCase().replace(/\s+/g, '-');
    this.games.unshift({ id, ...v, category: categoryString });
  }

  // TODO: ส่ง API: แนบ v.categories เป็น array หรือ categoryString ตามสเปกหลังบ้าน
  this.clear();
}

  remove() {
    if (!this.editingId) return;
    this.games = this.games.filter(g => g.id !== this.editingId);
    // TODO: DELETE /api/games/:id
    this.clear();
  }

  clear() {
    this.editingId = null;
    this.selectedCats = [];
    this.form.reset({ title: '', price: 599, categories: [], dev: '', desc: '', files: null });
    this.droppedFiles = [];
  }


  onBrowse(input: HTMLInputElement) { input.click(); }
  onFileInput(ev: Event) {
    const files = (ev.target as HTMLInputElement).files;
    if (!files) return;
    this.droppedFiles = [...this.droppedFiles, ...Array.from(files)];
    this.form.patchValue({ files: this.droppedFiles });
  }
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    if (!ev.dataTransfer?.files?.length) return;
    this.droppedFiles = [...this.droppedFiles, ...Array.from(ev.dataTransfer.files)];
    this.form.patchValue({ files: this.droppedFiles });
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }
  removeFile(i: number) {
    this.droppedFiles.splice(i, 1);
    this.form.patchValue({ files: this.droppedFiles });
  }
}
