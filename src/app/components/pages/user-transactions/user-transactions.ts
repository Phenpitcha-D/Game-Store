import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Convert, User, UserLoginRespon } from '../../models/res/user_login_res';
import { Constants } from '../../../config/constants';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { WalletTransactions } from '../../models/res/getWalletTrans';


@Component({
  selector: 'app-user-transactions',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './user-transactions.html',
  styleUrl: './user-transactions.scss'
})
export class UserTransactions implements OnInit {

    currentUser: UserLoginRespon | undefined;
    allUsers: User[] = [];
    data: WalletTransactions | undefined;


  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private constants: Constants
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.loadAllUsers();
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

private loadAllUsers() {
  this.allUsers = [];

  const url = `${this.constants.API_ENDPOINT}/api/profile`;
  const token = this.currentUser?.token?.trim();
  const useBearer = !!token;
  const headers = useBearer ? { Authorization: `Bearer ${token}` } : undefined;

  this.http.get<any>(url, {
    headers,
  }).subscribe({
    next: (res) => {
      const rows: User[] = Array.isArray(res) ? res : (res?.data ?? []);
      this.allUsers = rows
        .filter(u => (u.role ?? '').toString().toUpperCase() !== 'ADMIN')
        .map(u => ({
          ...u,
          img: u.img ?? 'assets/avatars/default.png',
        }));
      this.cdr.markForCheck();
    },
    error: (e) => {
      console.error('GET /api/profile failed:', e?.status, e?.error || e);
      this.allUsers = [];
      this.cdr.markForCheck();
    }
  });
  }

  selectedUser?: User;
  q = new FormControl<string>('', { nonNullable: true });

  get filteredUsers(): User[] {
    const s = this.q.value.trim().toLowerCase();
    if (!s) return this.allUsers;
    return this.allUsers.filter(u => u.username.toLowerCase().includes(s));
  }

  selectUser(u: User) { 
    this.selectedUser = u.uid ? u : undefined;
    this.getTransactionsByUID(String(u.uid));
  }

  isSelected(u: User) { return this.selectedUser?.uid === u.uid; }
  
  private getTransactionsByUID(uid: string) {
    if (!uid) return;
    const token = this.currentUser?.token?.trim();
    const useBearer = !!token;
    const headers = useBearer ? { Authorization: `Bearer ${token}` } : undefined;

    this.http.get<WalletTransactions>(`${this.constants.API_ENDPOINT}/api/wallet/transactions/${uid}?sort=desc`, { headers }).subscribe({
      next: (res) => {
        console.log('GET /api/transactions/:uid success:', res);
        this.data = res;
      },
      error: (e) => {
        console.error('GET /api/transactions/:uid failed:', e?.status, e?.error || e);
      }
    });
  }


}
