import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../config/constants';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private constants : Constants, private http: HttpClient) {}

  public async Login(email: string, password: string) {
    const url = this.constants.API_ENDPOINT + '/api/auth/login';
    const response = await lastValueFrom(this.http.post(url, { email, password }));
    return response;
  }
}