import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-admin-manager',
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-manager.html',
  styleUrl: './admin-manager.scss'
})
export class AdminManager {
   stats = {
    games: 128,
    users: 2431,
    salesM: 1.9,
  };
  
}

