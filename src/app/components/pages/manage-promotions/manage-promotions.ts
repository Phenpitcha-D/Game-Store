import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

/** ===== Types that match your backend ===== */
type PromoStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DEPLETED';
type UiPromoType = 'percent' | 'fixed';

interface PromoRowFromApi {
  pid: number;
  code: string;
  description?: string | null;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string;     // backend ให้มาเป็น string
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;   // ISO
  expires_at: string | null;  // ISO
  created_at: string;
}

/** View model ให้ตรงกับ template (p.type / p.value / p.used / p.maxUses) */
interface PromoVM {
  pid: number;
  code: string;
  type: UiPromoType;    // 'percent' | 'amount'
  value: number;        // number
  used: number;
  maxUses: number | null;
  startAt: string | null; // yyyy-MM-dd หรือ null
  endAt: string | null;   // yyyy-MM-dd หรือ null
  notes?: string | null;
}

@Component({
  selector: 'app-admin-promos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './manage-promotions.html',
  styleUrls: ['./manage-promotions.scss']
})
export class ManagePromotions implements OnInit {
  private readonly base = 'https://game-store-backend-vs08.onrender.com';

  form!: FormGroup;
  isSubmitting = false;
  editingId: number | null = null;

  /** raw จาก API */
  private promosRaw = signal<PromoRowFromApi[]>([]);
  /** filter & search states */
  statusFilter = signal<'all'|'active'|'expired'|'depleted'|'scheduled'>('all');
  q = signal<string>('');

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{3,20}$/)]],
      type: ['percent' as UiPromoType, [Validators.required]],
      value: [10, [Validators.required, Validators.min(1)]],
      notes: [''],

      noLimit: [true],
      maxUses: [{ value: null, disabled: true }, [Validators.min(1)]],

      startAt: [null], // yyyy-MM-dd
      endAt: [null],   // yyyy-MM-dd
    });

    this.form.get('noLimit')!.valueChanges.subscribe((v: boolean) => {
      const ctrl = this.form.get('maxUses')!;
      if (v) { ctrl.disable(); ctrl.setValue(null); }
      else   { ctrl.enable();  ctrl.setValue(100); }
    });

    this.loadPromos();
  }

  /** ===== Helpers ===== */
  private auth() {
    const token = localStorage.getItem('token') ?? '';
    return token ? { headers: new HttpHeaders().set('Authorization', `Bearer ${token}`) } : {};
  }
  private todayISO() { return new Date().toISOString().slice(0, 10); }
  private toUiType(t: 'PERCENT'|'FIXED'): UiPromoType { return t === 'PERCENT' ? 'percent' : 'fixed'; }
  private toApiType(t: UiPromoType): 'PERCENT'|'FIXED' { return t === 'percent' ? 'PERCENT' : 'FIXED'; }

  /** map raw -> VM ให้ตรง template */
  private mapToVM = (r: PromoRowFromApi): PromoVM => ({
    pid: r.pid,
    code: r.code,
    type: this.toUiType(r.discount_type),
    value: Number(r.discount_value),
    used: r.used_count,
    maxUses: r.max_uses,
    startAt: r.starts_at ? r.starts_at.slice(0,10) : null,
    endAt: r.expires_at ? r.expires_at.slice(0,10) : null,
    notes: r.description ?? '',
  });

  /** สถานะสำหรับ badge */
  promoStatus(p: PromoVM): PromoStatus {
    const today = this.todayISO();
    if (p.maxUses !== null && p.used >= p.maxUses) return 'DEPLETED';
    if (p.startAt && today < p.startAt) return 'SCHEDULED';
    if (p.endAt && today > p.endAt) return 'EXPIRED';
    return 'ACTIVE';
  }
  badgeClass(s: PromoStatus) {
    return {
      ACTIVE: 'status-active',
      SCHEDULED: 'status-scheduled',
      EXPIRED: 'status-expired',
      DEPLETED: 'status-depleted',
    }[s];
  }

  /** ===== Load list ===== */
  loadPromos() {
    this.http.get<{success: boolean; data: PromoRowFromApi[]}>(`${this.base}/api/promo`, this.auth())
      .subscribe({
        next: res => { if (res.success) this.promosRaw.set(res.data); },
        error: err => console.error('Load promos failed:', err)
      });
  }

  /** list ที่พร้อมใช้กับ *ngFor */
  promos = computed<PromoVM[]>(() => this.promosRaw().map(this.mapToVM));

  /** filter + search */
  filteredPromos = computed<PromoVM[]>(() => {
    const kw = this.q().trim().toLowerCase();
    const f = this.statusFilter();
    return this.promos()
      .filter(p => !kw || p.code.toLowerCase().includes(kw))
      .filter(p => {
        if (f === 'all') return true;
        return this.promoStatus(p).toLowerCase() === f;
      });
  });

  /** ===== UI actions ===== */
  normalizeCode() {
    const c = (this.form.value.code || '') as string;
    this.form.patchValue({ code: c.toUpperCase().trim() });
  }

  startAdd() {
    this.editingId = null;
    this.form.reset({
      code: '',
      type: 'percent',
      value: 10,
      notes: '',
      noLimit: true,
      maxUses: null,
      startAt: null,
      endAt: null,
    });
    this.form.get('maxUses')!.disable();
  }

  edit(p: PromoVM) {
    this.editingId = p.pid;
    this.http.get<{success: boolean; promo: PromoRowFromApi}>(`${this.base}/api/promo/${p.pid}`, this.auth())
      .subscribe({
        next: res => {
          const d = this.mapToVM(res.promo);
          this.form.reset({
            code: d.code,
            type: d.type,
            value: d.value,
            notes: d.notes ?? '',
            noLimit: d.maxUses === null,
            maxUses: d.maxUses,
            startAt: d.startAt,
            endAt: d.endAt,
          });
          const ctrl = this.form.get('maxUses')!;
          (d.maxUses === null) ? ctrl.disable() : ctrl.enable();
        },
        error: err => { console.error(err); alert('โหลดข้อมูลโปรไม่สำเร็จ'); }
      });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting = true;

    const v = this.form.getRawValue();
    const body = {
      code: (v.code as string).trim().toUpperCase(),
      description: v.notes || '',
      discount_type: this.toApiType(v.type),
      discount_value: Number(v.value),
      max_uses: v.noLimit ? null : Number(v.maxUses),
      starts_at: v.startAt ? `${v.startAt} 00:00:00` : null,
      expires_at: v.endAt ? `${v.endAt} 23:59:59` : null,
    };

    const req$ = this.editingId
      ? this.http.patch(`${this.base}/api/promo/${this.editingId}`, body, this.auth())
      : this.http.post(`${this.base}/api/promo`, body, this.auth());

    req$.subscribe({
      next: (res: any) => {
        alert(res?.message || 'บันทึกสำเร็จ');
        this.isSubmitting = false;
        this.editingId = null;
        this.startAdd();
        this.loadPromos();
      },
      error: err => {
        console.error('Save promo failed:', err);
        alert('บันทึกไม่สำเร็จ');
        this.isSubmitting = false;
      }
    });
  }

  remove(p: PromoVM) {
    if (!confirm(`ต้องการลบโค้ด ${p.code} ?`)) return;
    this.http.delete(`${this.base}/api/promo/${p.pid}`, this.auth())
      .subscribe({
        next: (res: any) => {
          alert(res?.message || 'ลบสำเร็จ');
          if (this.editingId === p.pid) this.startAdd();
          this.loadPromos();
        },
        error: err => { console.error('Delete promo failed:', err); alert('ลบไม่สำเร็จ'); }
      });
  }

  trackById = (_: number, p: PromoVM) => p.pid;
}
