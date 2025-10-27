import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Game } from '../../models/req/topseller';

@Component({
  selector: 'app-top-sellers',
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './top-sellers.html',
  styleUrl: './top-sellers.scss'
})
export class TopSellers implements OnInit {
  games: Game[] = [];
  constructor(private constants: Constants,private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef){}
  ngOnInit(): void {
    this.loadTopSeller();
  }
  loadTopSeller(){
    this.http.get<TopGameReturn>(`https://game-store-backend-vs08.onrender.com/api/top-sellers`).subscribe(
      (response) => {
        this.games = response.data;
        this.cdr.detectChanges();
      }
    );
  }
}

export interface TopGameReturn {
    success: boolean;
    scope:   Scope;
    count:   number;
    data:    Datum[];
}

export interface Datum {
    gid:           number;
    name:          string;
    price:         number;
    developer:     string;
    rank_score:    number;
    sold_count:    number;
    total_revenue: number;
    first_paid_at: Date;
    last_paid_at:  Date;
    images:        Image[];
}

export interface Image {
    imgid:      number;
    gid:        number;
    url:        string;
    created_at: Date;
}

export interface Scope {
    type: string;
    date: null;
}
