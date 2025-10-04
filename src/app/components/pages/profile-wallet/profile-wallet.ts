import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

type TxType = 'topup' | 'purchase';
interface Tx { type: TxType; title: string; amount: number; date: string; }

@Component({
  selector: 'app-profile-wallet',
  templateUrl: './profile-wallet.html',
  styleUrls: ['./profile-wallet.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProfileWallet implements OnInit {
  user = {
    name: 'Gwen Stacy',
    email: 'gwenstacy@example.com',
    avatarUrl: 'assets/images/avatar.jpg',
  };

  balance = 1250;
  quick = [100, 200, 500];

  txs: Tx[] = [
    { type: 'topup',    title: 'Top-up ฿500',                         amount: +500,  date: '2025-09-20' },
    { type: 'purchase', title: 'Purchase: Nightfall Protocol – ฿599', amount: -599,  date: '2025-09-21' },
    { type: 'topup',    title: 'Top-up ฿200',                         amount: +200,  date: '2025-09-22' },
  ];

  constructor() {}

  ngOnInit(): void {}

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
