import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('darkMode');
      this.darkMode = stored === 'true';
    }
    this.applyTheme();
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkMode', String(this.darkMode));
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }
}
