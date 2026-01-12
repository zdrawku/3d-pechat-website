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

    // In a real deployment, you would redirect to the other locale's URL
    // For local development with 'ng serve --configuration=en', this won't automatically switch
    // because Angular builds separate bundles for each locale.

    // Assuming standard Angular localization setup where locales are served from subdirectories
    // or different ports/domains.

    // Example logic for switching (adjust based on your deployment strategy):
    const currentUrl = window.location.href;
    let newUrl = currentUrl;

    if (newLang === 'en') {
        // If we are currently in BG (root or /bg/), switch to /en/
        // This is a simplified example. You might need more robust URL handling.
        if (currentUrl.includes('/bg/')) {
             newUrl = currentUrl.replace('/bg/', '/en/');
        } else {
             // Assuming root is BG, append /en/ (or replace base path)
             // This part depends heavily on how you serve the app.
             // For now, let's just alert or log, as we can't easily switch ports in dev mode.
             console.log('Switching to English');
             // window.location.href = '/en/'; // Uncomment for production if served under /en/
        }
    } else {
        // Switch to BG
        if (currentUrl.includes('/en/')) {
            newUrl = currentUrl.replace('/en/', '/bg/'); // or remove /en/ if BG is root
        }
         console.log('Switching to Bulgarian');
    }

    // For development purposes, we can't easily hot-swap locales without restarting ng serve
    // with a different configuration.
    alert(`To see the ${newLang.toUpperCase()} version in development, please run: ng serve --configuration=${newLang}`);
  }
}
