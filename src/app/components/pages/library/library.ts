import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { GetUserLIB } from '../../models/res/get_UserLib_res';
import { Constants } from '../../../config/constants';
import { CommonModule } from '@angular/common';
import { UserLoginRespon } from '../../models/res/user_login_res';

@Component({
  selector: 'app-library',
  imports: [HttpClientModule, CommonModule],
  templateUrl: './library.html',
  styleUrl: './library.scss'
})
export class Library implements OnInit {
  myGames: GetUserLIB['data'] = [];
  currentUser: UserLoginRespon | undefined;
  constructor(private http: HttpClient, private constant: Constants) {}

  ngOnInit() {
    this.loadUserLibrary();
  }

loadUserLibrary() {
  const raw =
    this.currentUser?.token ??
    localStorage.getItem('token') ??
    localStorage.getItem('auth_token') ??
    '';

  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

  const headers = token
    ? new HttpHeaders({ Authorization: `Bearer ${token}` })
    : undefined;

  this.http
    .get<GetUserLIB>(`${this.constant.API_ENDPOINT}/api/lib`, { headers })
    .subscribe({
      next: (res) => {
        if (res.success) this.myGames = res.data;
      },
      error: (err) => {
        console.error('Failed to load user library', err);
      },
    });
}


}
