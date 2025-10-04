import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Convert, UserLoginRespon } from '../../models/user_login_res';
import { Router } from '@angular/router';

type TxType = 'topup' | 'purchase';
interface Tx { type: TxType; title: string; amount: number; date: string; }

@Component({
  selector: 'app-profile-wallet',
  templateUrl: './profile-wallet.html',
  styleUrls: ['./profile-wallet.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProfileWallet implements OnInit {
  // ใส่ไว้ในคลาส component
defaultAvatar = 'https://st4.depositphotos.com/14953852/22772/v/450/depositphotos_227725020-stock-illustration-image-available-icon-flat-vector.jpg';

  currentUser: UserLoginRespon | undefined;
  private onAuthChanged = () => {
    this.loadUser();
    this.cdr.markForCheck();
  };


  balance = 1250;
  quick = [100, 200, 500];

  txs: Tx[] = [
    { type: 'topup',    title: 'Top-up ฿500',                         amount: +500,  date: '2025-09-20' },
    { type: 'purchase', title: 'Purchase: Nightfall Protocol – ฿599', amount: -599,  date: '2025-09-21' },
    { type: 'topup',    title: 'Top-up ฿200',                         amount: +200,  date: '2025-09-22' },
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUser();
    // ฟังเหตุการณ์เปลี่ยนสถานะล็อกอินจากทุกที่
    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged); // เผื่อหลายแท็บ
  }

  private loadUser() {
      this.currentUser = undefined;
      const raw = localStorage.getItem('user');
      if (!raw) return;
      try {
        this.currentUser = Convert.toUserLoginRespon(raw);
      } catch {
        this.currentUser = undefined;
      }
    }

  topup(n: number) {
    this.balance += n;
    this.txs.unshift({
      type: 'topup',
      title: `Top-up ฿${n}`,
      amount: +n,
      date: new Date().toISOString().slice(0, 10),
    });
  }
}
