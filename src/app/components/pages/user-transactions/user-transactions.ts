import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

type User = { id: string; name: string; avatar: string; lastPay?: number };
type Txn  = { id: string; userId: string; type: 'topup'|'purchase'; title: string; amount: number; date: string };

@Component({
  selector: 'app-user-transactions',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-transactions.html',
  styleUrl: './user-transactions.scss'
})
export class UserTransactions {
  users: User[] = [
    { id: 'u1', name: 'Gwen Stacy',   avatar: 'assets/avatars/gwen.jpg',   lastPay: 399 },
    { id: 'u2', name: 'Chrono Rift',  avatar: 'assets/avatars/chrono.jpg', lastPay: 599 },
    { id: 'u3', name: 'Mech Arena X', avatar: 'assets/avatars/mech.jpg',   lastPay: 799 },
    { id: 'u4', name: 'Nebula Drifters', avatar: 'assets/avatars/nebula.jpg', lastPay: 899 },
  ];

  // mock txns (ต่าง userId)
  txns: Txn[] = [
    { id:'t1', userId:'u1', type:'topup',    title:'Top-up ฿500', amount: 500, date:'2025-09-20' },
    { id:'t2', userId:'u1', type:'purchase', title:'Purchase: Nightfall Protocol – ฿599', amount: 599, date:'2025-09-21' },
    { id:'t3', userId:'u1', type:'topup',    title:'Top-up ฿200', amount: 200, date:'2025-09-22' },

    { id:'t4', userId:'u2', type:'purchase', title:'Purchase: Nightfall Protocol – ฿599', amount: 599, date:'2025-09-19' },
    { id:'t5', userId:'u2', type:'topup',    title:'Top-up ฿500', amount: 500, date:'2025-09-18' },

    { id:'t6', userId:'u3', type:'purchase', title:'Purchase: Mech Arena X – ฿799', amount: 799, date:'2025-09-21' },

    { id:'t7', userId:'u4', type:'purchase', title:'Purchase: Nebula Drifters – ฿899', amount: 899, date:'2025-09-21' },
  ];

  // state
  selectedUser?: User;
  q = new FormControl<string>('', { nonNullable: true });

  get filteredUsers(): User[] {
    const s = this.q.value.trim().toLowerCase();
    if (!s) return this.users;
    return this.users.filter(u => u.name.toLowerCase().includes(s));
  }

  get txnsForSelected(): Txn[] {
    if (!this.selectedUser) return [];
    return this.txns
      .filter(t => t.userId === this.selectedUser!.id)
      .sort((a,b) => (a.date < b.date ? 1 : -1));
  }

  selectUser(u: User) { this.selectedUser = u; }
  isSelected(u: User) { return this.selectedUser?.id === u.id; }
}
