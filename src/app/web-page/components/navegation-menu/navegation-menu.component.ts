import { Component, Renderer2 } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navegation-menu.component.html',
  styleUrls: ['./navegation-menu.component.css']
})
export class NavegationMenuComponent {constructor(private renderer: Renderer2) {}

  toggleMenu(ev: Event) {
    const btn = ev.currentTarget as HTMLElement;
    const nav = document.getElementById('nav-links');
    if (!nav) return;
    const isShown = nav.classList.contains('show');
    if (isShown) {
      nav.classList.remove('show');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      nav.classList.add('show');
      btn.setAttribute('aria-expanded', 'true');
    }
  }
}
