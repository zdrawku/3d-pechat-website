import { Component, ElementRef, HostListener, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IGX_NAVBAR_DIRECTIVES, IGX_NAVIGATION_DRAWER_DIRECTIVES, IgxButtonDirective, IgxIconButtonDirective, IgxIconComponent, IgxIconService, IgxNavigationDrawerComponent, IgxToggleActionDirective, IgxTooltipDirective, IgxTooltipTargetDirective } from 'igniteui-angular';
import { instagram, tiktok } from '@igniteui/material-icons-extended';
import { GOOGLE_REVIEW_URL } from '../data/site-links';
import { ReviewCtaComponent } from './shared/review-cta/review-cta.component';

@Component({
  selector: 'app-root',
  imports: [IGX_NAVIGATION_DRAWER_DIRECTIVES, IGX_NAVBAR_DIRECTIVES, IgxButtonDirective, IgxIconButtonDirective, IgxToggleActionDirective, IgxIconComponent, IgxTooltipDirective, IgxTooltipTargetDirective, RouterOutlet, RouterLink, RouterLinkActive, ReviewCtaComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('navigationdrawer1', { static: true }) public drawer!: IgxNavigationDrawerComponent;
  public isDarkTheme = false;
  /** Direct Google write-review link, shared by every review CTA (see site-links). */
  public readonly googleReviewUrl = GOOGLE_REVIEW_URL;

  constructor(
    public router: Router,
    private iconService: IgxIconService,
  ) {
    this.iconService.addSvgIconFromText(instagram.name, instagram.value, 'imx-icons');
    this.iconService.addSvgIconFromText(tiktok.name, tiktok.value, 'imx-icons');
  }

  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject(ElementRef<HTMLElement>);

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


  // Drawer chips use [routerLink] directly (for native keyboard/focus support);
  // this only handles closing the drawer overlay on small screens afterwards.
  public closeDrawerOnMobile(): void {
    if (this.drawer && !this.drawer.pin) {
      this.drawer.close();
    }
  }

  /**
   * Close the drawer when a click lands outside it.
   *
   * Below 1024px Ignite renders its own overlay, which already handles this.
   * At >=1024px the drawer is laid out as a persistent sidebar by CSS
   * (`position: sticky` in app.component.scss) while Ignite still treats it as
   * an unpinned overlay drawer — so it renders no overlay and nothing catches
   * the outside click, leaving the hamburger as the only way to close it.
   * This restores the expected toggle behaviour at those widths.
   */
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId) || !this.drawer?.isOpen) {
      return;
    }
    // Let Ignite's overlay own this below the desktop breakpoint.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      return;
    }

    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    const aside = this.host.nativeElement.querySelector('.igx-nav-drawer__aside');
    // The hamburger is an igxToggleAction: it toggles on its own, so ignoring it
    // here prevents this handler from immediately undoing an intended open.
    const trigger = this.host.nativeElement.querySelector('.menu-trigger');
    if (aside?.contains(target) || trigger?.contains(target)) {
      return;
    }

    this.drawer.close();
  }
}
