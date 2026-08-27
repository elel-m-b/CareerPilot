import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('dark');
  theme$ = this.themeSubject.asObservable();

  constructor() {
    const savedTheme = (localStorage.getItem('app_theme') as Theme) || 'dark';
    this.setTheme(savedTheme);
  }

  setTheme(theme: Theme) {
    this.themeSubject.next(theme);
    localStorage.setItem('app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme() {
    const current = this.themeSubject.getValue();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  get currentTheme(): Theme {
    return this.themeSubject.getValue();
  }
}
