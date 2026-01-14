import { Component, OnInit, ViewChild, Inject, LOCALE_ID } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterOutlet } from '@angular/router';
import { IGX_NAVBAR_DIRECTIVES, IGX_NAVIGATION_DRAWER_DIRECTIVES, IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent, IgxNavigationDrawerComponent, IgxToggleActionDirective, IgxTooltipDirective, IgxTooltipTargetDirective } from 'igniteui-angular';

@Component({
  selector: 'app-root',
  imports: [IGX_NAVIGATION_DRAWER_DIRECTIVES, IGX_NAVBAR_DIRECTIVES, IgxIconButtonDirective, IgxToggleActionDirective, IgxIconComponent, IgxButtonDirective, IgxTooltipDirective, IgxTooltipTargetDirective, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('navigationdrawer1', { static: true }) public drawer!: IgxNavigationDrawerComponent;
  private isDarkTheme = false;
  public currentLanguage: string;

  constructor(
    public router: Router,
    @Inject(LOCALE_ID) public locale: string
  ) {
    this.currentLanguage = locale.startsWith('en') ? 'en' : 'bg';
  }

  ngOnInit(): void {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      this.applyTheme();
    } else {
      // Check system preference
      this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme();
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    // Save preference
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  private applyTheme(): void {
    const root = document.documentElement;
    if (this.isDarkTheme) {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
  }


  public isActive(path: string): boolean {
    const exactMatch: IsActiveMatchOptions = {
        paths: 'exact',
        matrixParams: 'ignored',
        queryParams: 'ignored',
        fragment: 'ignored'
    }
    return this.router.isActive(path, exactMatch);
  }

  public navigate(path: string): void {
    this.router.navigate([path]);
    // Close drawer on small screens after navigation
    if (this.drawer && !this.drawer.pin) {
      this.drawer.close();
    }
  }

  public switchLanguage(): void {
    const newLang = this.currentLanguage === 'bg' ? 'en' : 'bg';

    const { pathname, search, hash, origin } = window.location;
    let newPath = pathname;
    let newOrigin = origin;

    if (newLang === 'en') {
      // Switch to English: Prepend /en if not present
      if (!pathname.startsWith('/en/')) {
        newPath = `/en${pathname === '/' ? '/' : pathname}`;
      }
      // Handle local development port switching
      if (newOrigin.includes('localhost')) {
        newOrigin = newOrigin.replace('4200', '4201');
      }
    } else {
      // Switch to Bulgarian: Remove /en prefix
      if (pathname.startsWith('/en/')) {
        newPath = pathname.substring(3) || '/';
      }
      // Handle local development port switching
      if (newOrigin.includes('localhost')) {
        newOrigin = newOrigin.replace('4201', '4200');
      }
    }

    window.location.href = `${newOrigin}${newPath}${search}${hash}`;
  }
}
