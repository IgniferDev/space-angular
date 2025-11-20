import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private defaultTheme = 'dark';
  private storageKey = 'spaceedu-theme';

  constructor() {
    this.loadSavedTheme();
  }

  /** Lee localStorage o aplica el tema default */
  loadSavedTheme() {
    const saved = localStorage.getItem(this.storageKey);
    const theme = saved || this.defaultTheme;

    document.body.dataset['theme'] = theme; // ← FIX
  }

  /** Cambia el tema y lo guarda */
  setTheme(theme: string) {
    document.body.dataset['theme'] = theme; // ← FIX
    localStorage.setItem(this.storageKey, theme);
  }

  /** Recuperar tema actual */
  getCurrentTheme(): string {
    return document.body.dataset['theme'] || this.defaultTheme; // ← FIX
  }
}
