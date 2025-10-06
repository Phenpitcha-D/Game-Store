import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminManager } from '../admin-manager/admin-manager';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, AdminManager],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class Admin {

}
