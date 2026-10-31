import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { TranslatePipe } from '../../../i18n/translate.pipe';
import roadmapMarkdown from '../../../../../ROADMAP.md';
import { RoadmapTier, parseRoadmap } from './roadmap';

/** Where a Details link (repo-relative, e.g. `BOOKMARKS-PLAN.md#status`) opens. */
export const REPO_BLOB_URL = 'https://github.com/zdrawku/3d-pechat-website/blob/main/';

const TIER_ICONS: Record<string, string> = {
  now: 'priority_high',
  next: 'arrow_forward',
  later: 'schedule',
  waiting: 'hourglass_empty',
  ideas: 'lightbulb'
};

const ALL = '';

/**
 * The Studio's Roadmap tab: ROADMAP.md as cards, one section per priority tier,
 * filterable by area. The items are the owners' notes, in English as written;
 * only the tab's own labels are translated. Loaded with @defer, so the text
 * reaches the browser only once the Studio is unlocked and the tab is opened.
 */
@Component({
  selector: 'app-studio-roadmap',
  imports: [IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './studio-roadmap.component.html',
  styleUrl: './studio-roadmap.component.scss'
})
export class StudioRoadmapComponent {
  protected readonly tiers: RoadmapTier[] = parseRoadmap(roadmapMarkdown);
  protected readonly areas = [...new Set(this.tiers.flatMap(t => t.items.map(i => i.area)))].sort();
  protected readonly area = signal(ALL);
  protected readonly all = ALL;

  protected readonly shown = computed(() => {
    const area = this.area();
    return this.tiers
      .map(tier => ({ ...tier, items: tier.items.filter(item => area === ALL || item.area === area) }))
      .filter(tier => tier.items.length > 0);
  });

  protected readonly count = computed(() => this.shown().reduce((sum, tier) => sum + tier.items.length, 0));

  protected icon(tier: RoadmapTier): string {
    return TIER_ICONS[tier.key] ?? 'flag';
  }

  protected link(href: string): string {
    return /^https?:/.test(href) ? href : REPO_BLOB_URL + href;
  }
}
