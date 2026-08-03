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
  /**
   * Drives `[isOpen]` on the drawer. Starts `true` so the prerendered HTML has
   * the desktop sidebar open; ngOnInit narrows it to desktop-only in the
   * browser. Must be kept in sync whenever the drawer is closed in code, or the
   * binding will reopen it on the next change-detection pass.
   */
  public drawerOpen = true;
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

    // The drawer's open state is bound to `drawerOpen` rather than a literal
    // `true`: a static binding is re-applied on every change-detection pass, so
    // drawer.close() was instantly reverted and the menu could never be
    // dismissed by clicking outside it. Setting the field keeps the binding and
    // the component in agreement.
    //
    // Only the desktop sidebar layout starts open; on mobile the drawer is an
    // overlay covering the page and must not block the content on load.
    this.drawerOpen = window.matchMedia('(min-width: 1024px)').matches;
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
      this.drawerOpen = false;
      this.drawer.close();
    }
  }

  /**
   * Close the drawer when a click lands outside it — **on mobile layouts only.**
   *
   * The two layouts want opposite behaviour:
   *
   * - **<=1023px** the drawer is an overlay sitting *on top of* the content
   *   (see the `max-width: 1023px` block in app.component.scss), so a click on
   *   the page behind it means "dismiss the menu".
   * - **>=1024px** the drawer is a persistent sidebar (`position: sticky`)
   *   laid out *beside* the content, and it starts open (`[isOpen]="true"`).
   *   Closing it on any outside click made every ordinary interaction with the
   *   page — clicking a product, a link, the carousel — collapse the menu. On
   *   this layout the hamburger in the toolbar is the only intended control.
   */
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId) || !this.drawer?.isOpen) {
      return;
    }
    // Desktop: the drawer is a sidebar next to the content, not over it — an
    // outside click is just normal page use and must not collapse the menu.
    if (window.matchMedia('(min-width: 1024px)').matches) {
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

    // On mobile Ignite renders a full-bleed `.igx-nav-drawer__overlay` over the
    // page but does NOT close the drawer when it is clicked. That overlay is
    // the click target for every tap outside the drawer, so it correctly falls
    // through to here and counts as an outside click.
    this.drawerOpen = false;
    this.drawer.close();
  }
}
