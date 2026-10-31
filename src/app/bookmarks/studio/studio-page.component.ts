import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IGX_TABS_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { SeoService } from '../../services/seo.service';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';
import { BookmarksPageComponent } from '../bookmarks-page/bookmarks-page.component';
import { StudioOrdersComponent } from './studio-orders.component';
import { StudioGateService } from './studio-gate.service';
import { StudioRoadmapComponent } from './roadmap/studio-roadmap.component';

/**
 * The bookmark Studio for the shop owners (hidden route /studio/).
 *
 * Not in any menu, sitemap or llms.txt, and `noindex`. Prerendered as the
 * passphrase gate only. Unlocked, it is the same page component as the
 * customer's, with the admin flag, plus an Orders tab and a Roadmap tab (see studio-gate.service
 * for what the gate is and is not).
 */
@Component({
  selector: 'app-studio-page',
  imports: [
    IGX_CARD_DIRECTIVES, IGX_INPUT_GROUP_DIRECTIVES, IGX_TABS_DIRECTIVES, IgxButtonDirective, IgxIconComponent,
    FormsModule, TranslatePipe, BookmarksPageComponent, StudioOrdersComponent, StudioRoadmapComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './studio-page.component.html',
  styleUrl: './studio-page.component.scss'
})
export class StudioPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly i18n = inject(I18nService);
  protected readonly gate = inject(StudioGateService);

  protected passphrase = '';
  protected readonly wrong = signal(false);
  protected readonly checking = signal(false);
  protected readonly tab = signal(0);

  constructor() {
    this.i18n.registerPage('bookmarks', bookmarksMessages);
  }

  ngOnInit(): void {
    this.seo.updateSeo({
      title: this.i18n.t('bookmarks.studio.title'),
      description: this.i18n.t('bookmarks.studio.gateIntro'),
      noindex: true
    });
    this.seo.removeStructuredData();
  }

  protected async unlock(): Promise<void> {
    this.checking.set(true);
    this.wrong.set(false);
    try {
      const ok = await this.gate.unlock(this.passphrase);
      this.wrong.set(!ok);
      if (ok) {
        this.passphrase = '';
      }
    } finally {
      this.checking.set(false);
    }
  }
}
