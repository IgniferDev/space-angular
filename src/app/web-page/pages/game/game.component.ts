import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavegationMenuComponent } from '../../components/navegation-menu/navegation-menu.component';import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, NavegationMenuComponent],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {
  embedVisible = false;
  embedUrlSafe: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * players: number | string (from <select>.value)
   * mode: string ('math'|'history')
   * type: string ('lives'|'timer')
   */
  startEmbed(players: string | number = 1, mode: string = 'math', type: string = 'lives') {
  let pNum = typeof players === 'string' ? parseInt(players, 10) : players;
  if (!Number.isFinite(pNum) || pNum < 1) pNum = 1;
  const url = `assets/game/index-embed.html#players=${encodeURIComponent(String(pNum))}&mode=${encodeURIComponent(mode)}&type=${encodeURIComponent(type)}`;
  this.embedUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  this.embedVisible = true;
}


  stopEmbed() {
    this.embedVisible = false;
    this.embedUrlSafe = null;
  }
}
