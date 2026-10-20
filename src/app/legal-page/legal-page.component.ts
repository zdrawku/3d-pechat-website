import { Component, ElementRef, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxIconComponent } from 'igniteui-angular';

import { I18nService } from '../i18n/i18n.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { SeoService } from '../services/seo.service';
import { LEGAL_DOCS, LegalDoc, LegalText } from './legal-docs';
import privacyMessages from '../../i18n/bg/privacy.json';
import termsMessages from '../../i18n/bg/terms.json';

/**
 * The Privacy Policy and the Terms of Use, in every language — approved design
 * „B“ (FEATURE-IDEAS-PLAN.md, artifact "Legal Pages Layout"): the page banner,
 * a „Накратко“ card with the key points, a contents list (beside the text on
 * desktop, above it on phones), then the numbered sections. The route says
 * which document (`data.doc`); its text comes resolved (legal-docs.ts).
 *
 * Built from Ignite UI: `igx-card` + `igx-card-header` (`igx-avatar`,
 * `igxCardHeaderTitle`) and `igx-icon` (asserted in the spec).
 */
@Component({
  selector: 'app-legal-page',
  imports: [IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxIconComponent, RouterLink, MarkdownModule, TranslatePipe],
  templateUrl: './legal-page.component.html',
  styleUrls: ['./legal-page.component.scss']
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  protected readonly i18n = inject(I18nService);

  protected readonly doc: LegalDoc = this.route.snapshot.data['doc'];
  protected readonly text: LegalText = this.route.snapshot.data['legalText'];
  protected readonly icon = LEGAL_DOCS[this.doc].icon;

  /** The page's strings: `privacy.*` or `terms.*` (src/i18n/<lang>/<doc>.json). */
  protected readonly keys = {
    title: `${this.doc}.title`,
    subtitle: `${this.doc}.subtitle`,
    summary: `${this.doc}.summary`,
    contents: `${this.doc}.contents`,
    updated: `${this.doc}.updated`
  } as const;

  /** „20 октомври 2026 г.“ / "October 20, 2026" — the hand-maintained date in LEGAL_DOCS. */
  protected readonly updated = computed(() => new Intl.DateTimeFormat(this.i18n.definition().intl, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(LEGAL_DOCS[this.doc].dateModified)));

  /**
   * A wide table (the cookie list) scrolls sideways in its own box; the box
   * must be reachable by keyboard to be scrolled (axe scrollable-region-focusable).
   * The tables come from the markdown, so they get it once a section renders.
   */
  protected onTextReady(): void {
    for (const table of this.host.nativeElement.querySelectorAll('.legal_text table')) {
      table.setAttribute('tabindex', '0');
    }
  }

  constructor(seo: SeoService) {
    this.i18n.registerPage('privacy', privacyMessages);
    this.i18n.registerPage('terms', termsMessages);
    seo.applyPageSeo(this.doc);
    seo.removeStructuredData();
  }
}
