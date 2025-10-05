import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Game = {
  id: string;
  rank: number;
  title: string;
  salesDate: string; // YYYY-MM-DD
  price: number;
  cover: string;     // path รูป
};

@Component({
  selector: 'app-top-sellers',
  imports: [CommonModule],
  templateUrl: './top-sellers.html',
  styleUrl: './top-sellers.scss'
})
export class TopSellers {
  games: Game[] = [
    {
      id: 'death-stranding',
      rank: 1,
      title: "Death Stranding : Director’s cut",
      salesDate: '2025-09-01',
      price: 399,
      cover: 'https://cdn2.unrealengine.com/cyberpunk-ds-carousel-1920x1080-1920x1080-2cead0da0561.jpg'
    },
    {
      id: 're4',
      rank: 2,
      title: 'Resident Evil 4',
      salesDate: '2025-09-01',
      price: 599,
      cover: 'https://cdn2.unrealengine.com/cyberpunk-ds-carousel-1920x1080-1920x1080-2cead0da0561.jpg'
    },
    {
      id: 'wukong',
      rank: 3,
      title: 'Black Myth: Wukong',
      salesDate: '2025-09-01',
      price: 799,
      cover: 'https://cdn2.unrealengine.com/cyberpunk-ds-carousel-1920x1080-1920x1080-2cead0da0561.jpg'
    },
    {
      id: 'elden-ring-nightreign',
      rank: 4,
      title: 'ELDEN RING NIGHTREIGN',
      salesDate: '2025-09-01',
      price: 899,
      cover: 'https://cdn2.unrealengine.com/cyberpunk-ds-carousel-1920x1080-1920x1080-2cead0da0561.jpg'
    },
    {
      id: 'rdr2',
      rank: 5,
      title: 'Red Dead Redemption 2',
      salesDate: '2025-09-01',
      price: 329,
      cover: 'https://cdn2.unrealengine.com/cyberpunk-ds-carousel-1920x1080-1920x1080-2cead0da0561.jpg'
    }
  ];

  goToDetails(game: Game) {
    // ใส่ router.navigate(['/details', game.id]) ได้ตามโครง route ของคุณ
    console.log('open details:', game.id);
  }
}
