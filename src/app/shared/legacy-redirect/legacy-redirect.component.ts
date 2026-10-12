import { Component, DestroyRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IgxButtonDirective } from 'igniteui-angular';

import { SITE_ORIGIN, SeoService } from '../../services/seo.service';

const REFRESH_SELECTOR = "http-equiv='refresh'";

/**
 * Stand-in for a page that was renamed or merged away.
 *
 * GitHub Pages has no server-side redirects, so each old path is routed here
 * (`{ path: '<old>', loadComponent: …, data: { to: '/blog/<new>/' } }`) and
 * prerendered to its own index.html containing:
 *   - <meta http-equiv="refresh" content="0; url=<new>">  — Google treats a
 *     zero-delay meta refresh as a permanent redirect and consolidates signals
 *     onto the target;
 *   - <link rel="canonical"> pointing at the new URL;
 *   - a visible link to the new page, for clients that follow neither.
 * In the browser the router also navigates there (replaceUrl, so Back doesn't
 * land on the stub again).
 *
 * The slash-less old URL still gets GitHub's 301 to the slash form first — a
 * two-hop chain (301 → meta refresh) that Google follows.
 */
@Component({
  selector: 'app-legacy-redirect',
  imports: [RouterLink, IgxButtonDirective],
  template: `
    <section class="legacy-redirect">
      <h1>Страницата е преместена</h1>
      <p>Съдържанието вече се намира на нов адрес.</p>
      <a igxButton="contained" [routerLink]="to">Към новата страница</a>
    </section>
  `,
  styles: `
    .legacy-redirect {
      max-width: 40rem;
      margin: 4rem auto;
      padding: 0 1rem;
      text-align: center;
    }
  `
})
export class LegacyRedirectComponent {
  readonly to: string = inject(ActivatedRoute).snapshot.data['to'];

  constructor() {
    const meta = inject(Meta);
    const router = inject(Router);
    const seo = inject(SeoService);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    if (!this.to?.startsWith('/')) {
      throw new Error(`LegacyRedirectComponent needs route data { to: '/…' }, got "${this.to}".`);
    }
    const target = `${SITE_ORIGIN}${this.to}`;

    // Canonical + og:url -> the new page (also sets title/description).
    seo.updateSeo({
      title: 'Страницата е преместена | 3D Печат България',
      description: 'Тази страница е преместена на нов адрес.',
      url: target
    });
    meta.updateTag({ 'http-equiv': 'refresh', content: `0; url=${target}` }, REFRESH_SELECTOR);

    if (isBrowser) {
      // A leftover refresh tag would bounce every later page of this SPA session.
      inject(DestroyRef).onDestroy(() => meta.removeTag(REFRESH_SELECTOR));
      router.navigateByUrl(this.to, { replaceUrl: true });
    }
  }
}
