import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Convert, UserLoginRespon } from '../../models/res/user_login_res';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { WalletTransactions } from '../../models/res/getWalletTrans';

export interface GetBalanceRes {
  success: boolean;
  uid: number;
  balance: number;
}

@Component({
  selector: 'app-profile-wallet',
  templateUrl: './profile-wallet.html',
  styleUrls: ['./profile-wallet.scss'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class ProfileWallet implements OnInit {
  defaultAvatar = 'https://st4.depositphotos.com/14953852/22772/v/450/depositphotos_227725020-stock-illustration-image-available-icon-flat-vector.jpg';

  form!: FormGroup;
  quick = [100, 200, 500];
  walletBalance: number = 0;
  data: WalletTransactions | undefined;

  currentUser: UserLoginRespon | undefined;
  private onAuthChanged = () => {
    this.loadUser();
    this.loadWallet();
    this.cdr.markForCheck();
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef, private fb: FormBuilder, private http: HttpClient, private constants: Constants) { }

  ngOnInit(): void {
    this.loadUser();
    this.loadWallet();
    this.getWalletTransactions();
    window.addEventListener('auth-changed', this.onAuthChanged);
    window.addEventListener('storage', this.onAuthChanged);
    window.addEventListener('wallet-changed', this.onWalletChanged);
    this.form = this.fb.group({
      customAmount: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('auth-changed', this.onAuthChanged);
    window.removeEventListener('storage', this.onAuthChanged);
    window.removeEventListener('wallet-changed', this.onWalletChanged);
  }

  private onWalletChanged = () => {
    this.loadWallet();
  };

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

  private loadWallet() {
    if (!this.currentUser) return;
    const token = this.currentUser?.token ?? localStorage.getItem('auth_token') ?? '';
    const baseHeaders = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    let options = { headers: baseHeaders };

    this.http.get<GetBalanceRes>(`${this.constants.API_ENDPOINT}/api/wallet/balance`, options)
      .subscribe({
        next: (res) => {
          if (res.success && this.currentUser) {
            this.walletBalance = res.balance;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load wallet:', err);
        }
      });
  }

  topup(amount?: number) {
    if (amount) {
      this.sendTopup(amount);
      console.log('Topup amount = ', amount);
      return;
    }

    const customAmount = this.form.value.customAmount;
    if (!customAmount || customAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      console.error('Invalid custom amount:', customAmount);
      return;
    }

    this.sendTopup(customAmount);
  }

  private sendTopup(amount: number) {
    console.log('Topup amount = ', amount);

    const body = { amount, note: 'Top-up' };
    const token = this.currentUser?.token ?? localStorage.getItem('auth_token') ?? '';
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.post(`${this.constants.API_ENDPOINT}/api/wallet/topup`, body, { headers })
      .subscribe({
        next: (res: any) => {

          this.loadWallet();
          this.getWalletTransactions();

          window.dispatchEvent(new CustomEvent('wallet-changed'));
          localStorage.setItem('wallet-updated', Date.now().toString());

          window.dispatchEvent(new CustomEvent('auth-changed'));

          this.cdr.markForCheck();
        },
        error: (err) => {
          alert('เกิดข้อผิดพลาดในการเติมเงิน');
          console.error('Top-up failed:', err);
        }
      });
  }

  private getWalletTransactions() {
    if (!this.currentUser) return;
    const token = this.currentUser?.token ?? localStorage.getItem('auth_token') ?? '';
    const baseHeaders = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    let options = { headers: baseHeaders };

    this.http.get<WalletTransactions>(`${this.constants.API_ENDPOINT}/api/wallet/transactions?sort=desc`, options)
      .subscribe({
        next: (res) => {
          console.log('Wallet transactions:', res);
          this.data = res;
        },
        error: (err) => {
          console.error('Failed to load wallet transactions:', err);
        }
      });
  }

}