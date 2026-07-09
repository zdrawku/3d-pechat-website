import { Component, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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

  constructor(
    public router: Router,
  ) {}

  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Theme detection needs localStorage/matchMedia — skip during prerendering
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
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
}
