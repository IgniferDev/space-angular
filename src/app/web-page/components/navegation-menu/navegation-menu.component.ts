import { Component, Renderer2, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../theme.service';

@Component({
  selector: 'app-navigation-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navegation-menu.component.html',
  styleUrls: ['./navegation-menu.component.css']
})
export class NavegationMenuComponent implements OnInit {

  currentTheme: string = 'light'; // valor por defecto

  constructor(
    private renderer: Renderer2,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  switchTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
    this.currentTheme = newTheme;
  }

  toggleMenu(ev: Event) {
    const btn = ev.currentTarget as HTMLElement;
    const nav = document.getElementById('nav-links');
    if (!nav) return;

    const show = nav.classList.toggle('show');
    btn.setAttribute('aria-expanded', show ? 'true' : 'false');
  }
}
