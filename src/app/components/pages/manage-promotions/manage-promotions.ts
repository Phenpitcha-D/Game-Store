import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

type PromoType = 'percent' | 'amount';
type PromoStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DEPLETED' | 'DISABLED';

interface Promo {
  id: string;
  code: string;
  type: PromoType;     // 'percent' = % ส่วนลด, 'amount' = ลดเป็นจำนวนเงิน
  value: number;       // ค่า % หรือ ฿
  maxUses: number | null; // null = ไม่จำกัด
  used: number;        // ใช้ไปแล้วกี่ครั้ง
  minSubtotal?: number | null; // ยอดสั่งซื้อขั้นต่ำ
  startAt?: string | null;     // ISO date (yyyy-mm-dd)
  endAt?: string | null;       // ISO date
  categories?: string[];       // หมวดที่ใช้ได้ (ถ้าเว้นว่าง = ทุกหมวด)
  notes?: string;
  active: boolean;     // เปิด/ปิดใช้งาน
}

@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-promotions.html',
  styleUrls: ['./manage-promotions.scss']
})
export class ManagePromotions implements OnInit {
  // ------- Mock master data -------
  ALL_CATEGORIES = ['Action','RPG','Indie','Strategy','Adventure','Sports','Simulation'];

  // ------- State -------
  form!: FormGroup;
  editingId: string | null = null;
  isSubmitting = false;

  // ลิสต์โปรโมชัน (mock แทน API)
  promos = signal<Promo[]>([
    { id:'SUMMER24', code:'SUMMER24', type:'percent', value:15, maxUses:200, used:35, minSubtotal:500, startAt:'2025-06-01', endAt:'2025-08-31', categories:['Action','RPG'], active:true },
    { id:'WELCOME',  code:'WELCOME',  type:'amount',  value:100, maxUses:null, used:0,   minSubtotal:null, startAt:null,      endAt:null,      categories:[],             active:true },
    { id:'BLACKFRI', code:'BLACKFRI', type:'percent', value:30, maxUses:50,  used:50,  minSubtotal:0,    startAt:'2025-11-28', endAt:'2025-11-29', categories:['Indie'],  active:true },
    { id:'PAUSE10',  code:'PAUSE10',  type:'amount',  value:10,  maxUses:10,  used:2,   minSubtotal:200,  startAt:null,      endAt:null,      categories:['Sports'],       active:false },
  ]);

  // กรองสถานะ
  statusFilter = signal<'all'|'active'|'scheduled'|'expired'|'depleted'|'disabled'>('all');
  q = signal<string>(''); // ค้นหาด้วย code

  // สำหรับ dropdown categories ในฟอร์ม
  selectedCats = signal<string[]>([]);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{3,20}$/)]],
      type: ['percent' as PromoType, [Validators.required]],
      value: [10, [Validators.required, Validators.min(1)]],
      noLimit: [true],               // ถ้า true => maxUses = null
      maxUses: [{value: null, disabled: true}, [Validators.min(1)]],
      minSubtotal: [null, [Validators.min(0)]],
      startAt: [null],
      endAt: [null],
      categories: [[]],
      notes: [''],
      active: [true],
    });

    // sync noLimit->maxUses enable/disable
    this.form.get('noLimit')!.valueChanges.subscribe((v: boolean) => {
      const ctrl = this.form.get('maxUses')!;
      if (v) { ctrl.disable(); ctrl.setValue(null); }
      else { ctrl.enable(); ctrl.setValue(100); }
    });
  }

  // ---------- Helpers ----------
  private todayISO(): string {
    const d = new Date();
    return d.toISOString().slice(0,10);
  }

  promoStatus(p: Promo): PromoStatus {
    if (!p.active) return 'DISABLED';
    const today = this.todayISO();
    if (p.maxUses !== null && p.used >= p.maxUses) return 'DEPLETED';
    if (p.startAt && today < p.startAt) return 'SCHEDULED';
    if (p.endAt && today > p.endAt) return 'EXPIRED';
    return 'ACTIVE';
  }

  badgeClass(s: PromoStatus): string {
    // ใช้ class ช่วยระบายสีสถานะ
    return {
      ACTIVE: 'status-active',
      SCHEDULED: 'status-scheduled',
      EXPIRED: 'status-expired',
      DEPLETED: 'status-depleted',
      DISABLED: 'status-disabled',
    }[s];
  }

  // ---------- Derived list ----------
  filteredPromos = computed(() => {
    const q = this.q().trim().toLowerCase();
    const f = this.statusFilter();
    return this.promos()
      .filter(p => !q || p.code.toLowerCase().includes(q))
      .filter(p => {
        const st = this.promoStatus(p);
        if (f === 'all') return true;
        if (f === 'active')    return st === 'ACTIVE';
        if (f === 'scheduled') return st === 'SCHEDULED';
        if (f === 'expired')   return st === 'EXPIRED';
        if (f === 'depleted')  return st === 'DEPLETED';
        if (f === 'disabled')  return st === 'DISABLED';
        return true;
      });
  });

  // ---------- UI actions ----------
  selectCat(name: string) {
    const arr = new Set(this.selectedCats());
    arr.has(name) ? arr.delete(name) : arr.add(name);
    // this.selectedCats(Array.from(arr));
    this.form.patchValue({ categories: this.selectedCats() });
  }
  isCatSelected(name: string){ return this.selectedCats().includes(name); }

  normalizeCode() {
    const c = (this.form.value.code || '') as string;
    this.form.patchValue({ code: c.toUpperCase().trim() });
  }

  startAdd() {
    this.editingId = null;
    // this.selectedCats([]);
    this.form.reset({
      code: '', type: 'percent', value: 10,
      noLimit: true, maxUses: null, minSubtotal: null,
      startAt: null, endAt: null, categories: [], notes: '', active: true
    });
    this.form.get('maxUses')!.disable();
  }

  edit(p: Promo) {
    this.editingId = p.id;
    // this.selectedCats(p.categories ?? []);
    const noLimit = p.maxUses === null;
    this.form.reset({
      code: p.code,
      type: p.type,
      value: p.value,
      noLimit,
      maxUses: p.maxUses,
      minSubtotal: p.minSubtotal ?? null,
      startAt: p.startAt ?? null,
      endAt: p.endAt ?? null,
      categories: p.categories ?? [],
      notes: p.notes ?? '',
      active: p.active,
    });
    const ctrl = this.form.get('maxUses')!;
    noLimit ? ctrl.disable() : ctrl.enable();
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;

    const v = this.form.getRawValue(); // รวม disabled controls
    const payload: Promo = {
      id: this.editingId ?? v.code,
      code: v.code,
      type: v.type,
      value: Number(v.value),
      maxUses: v.noLimit ? null : (v.maxUses ? Number(v.maxUses) : 0),
      used: this.editingId ? (this.promos().find(p => p.id === this.editingId)!.used) : 0,
      minSubtotal: v.minSubtotal != null ? Number(v.minSubtotal) : null,
      startAt: v.startAt || null,
      endAt: v.endAt || null,
      categories: (v.categories ?? []) as string[],
      notes: v.notes || '',
      active: !!v.active,
    };

    // TODO: เรียก API create/update จริง
    const next = [...this.promos()];
    const idx = next.findIndex(p => p.id === payload.id);
    if (idx >= 0) next[idx] = payload; else next.unshift(payload);
    // this.promos(next);

    this.isSubmitting = false;
    this.editingId = payload.id;
  }

  remove(p: Promo) {
    if (!confirm(`ลบโปรโมชัน ${p.code} ?`)) return;
    const next = this.promos().filter(x => x.id !== p.id);
    // this.promos(next);
    if (this.editingId === p.id) this.startAdd();
  }

  toggleActive(p: Promo) {
    // const next = this.promos().map(x => x.id === p.id ? { ...x, active: !x.active } : x);
    // this.promos(next);
  }

  trackById = (_: number, p: Promo) => p.id;
}
