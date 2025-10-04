import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  /** จำนวนสินค้าในตะกร้า (โชว์บน badge) */
  @Input() cartCount = 2;

  constructor(private router: Router) {}

  /** ใช้กับปุ่ม cart หรือเมนูที่อยากสั่งนำทางด้วยโค้ด */
  goTo(path: string): void {
    this.router.navigate([path]);
  }

  /** ทางลัดสำหรับปุ่ม Sign In (หากอยากใช้คลิกเรียกแทน routerLink) */
  signIn(): void {
    this.router.navigate(['/login']);
  }
}
