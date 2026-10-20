import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxButtonDirective } from 'igniteui-angular';

import { ConsentService } from '../../services/consent.service';
import { LocalizePathPipe, TranslatePipe } from '../../i18n/translate.pipe';

/**
 * The cookie consent card — approved design „B“ (FEATURE-IDEAS-PLAN.md,
 * artifact "Cookie Consent Variants"): a floating igx-card in the bottom-right
 * corner, over the hero picture rather than the text, and a sheet along the
 * bottom on phones. One question (Google Analytics) with two equal answers;
 * the page stays usable while it is open.
 *
 * It renders only in the browser (ConsentService.visible is false during
 * prerender) and is fixed to the viewport, so it shifts nothing.
 */
@Component({
  selector: 'app-consent-banner',
  imports: [IGX_CARD_DIRECTIVES, IgxAvatarComponent, IgxButtonDirective, RouterLink, TranslatePipe, LocalizePathPipe],
  templateUrl: './consent-banner.component.html',
  styleUrls: ['./consent-banner.component.scss']
})
export class ConsentBannerComponent {
  protected readonly consent = inject(ConsentService);
}
