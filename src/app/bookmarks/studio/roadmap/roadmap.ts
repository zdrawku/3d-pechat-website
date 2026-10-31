/**
 * Reads ROADMAP.md (the repo root's prioritised list of what to build next) into
 * tiers of items for the Studio's Roadmap tab. The file stays the one source:
 * edit the Markdown, rebuild, and the tab follows.
 *
 * Format (see the top of ROADMAP.md):
 *   ## Now: <what the tier means>        a tier; its key is the first word
 *   ### <item title>
 *   - Area: <area>                       one line per field, in any order
 *   - Impact: High | Medium | Low
 *   - Effort: <free text>
 *   - Status: <free text>
 *   - Details: [<label>](<repo-relative link>)
 *   <description paragraphs>
 */

export type RoadmapImpact = 'High' | 'Medium' | 'Low';

export interface RoadmapItem {
  title: string;
  area: string;
  impact: RoadmapImpact;
  effort: string;
  status: string;
  /** a repo-relative link, e.g. `BOOKMARKS-PLAN.md#status` */
  details: { label: string; href: string } | null;
  description: string;
}

export interface RoadmapTier {
  /** `now`, `next`, `later`, `waiting`… — the heading's first word, lower case */
  key: string;
  title: string;
  description: string;
  items: RoadmapItem[];
}

export const ROADMAP_IMPACTS: readonly RoadmapImpact[] = ['High', 'Medium', 'Low'];

const FIELD = /^-\s+\*{0,2}(Area|Impact|Effort|Status|Details):?\*{0,2}:?\s*(.*)$/;
const LINK = /\[([^\]]+)\]\(([^)]+)\)/;

/** Markdown inline marks to plain text: links keep their label, bold/italic/code lose their marks. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRoadmap(markdown: string): RoadmapTier[] {
  const tiers: RoadmapTier[] = [];
  let tier: RoadmapTier | null = null;
  let item: RoadmapItem | null = null;
  let text: string[] = [];

  const flush = (): void => {
    const joined = plainText(text.join(' '));
    if (item) {
      item.description = joined;
    } else if (tier) {
      tier.description = joined;
    }
    text = [];
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      flush();
      item = null;
      const title = line.slice(3).trim();
      tier = { key: title.split(/[\s:]+/)[0].toLowerCase(), title, description: '', items: [] };
      tiers.push(tier);
    } else if (line.startsWith('### ') && tier) {
      flush();
      item = { title: plainText(line.slice(4)), area: '', impact: 'Medium', effort: '', status: '', details: null, description: '' };
      tier.items.push(item);
    } else if (item && FIELD.test(line)) {
      const [, key, value] = line.match(FIELD)!;
      if (key === 'Details') {
        const link = value.match(LINK);
        item.details = link ? { label: link[1], href: link[2] } : null;
      } else if (key === 'Impact') {
        item.impact = value.trim() as RoadmapImpact;
      } else {
        item[key.toLowerCase() as 'area' | 'effort' | 'status'] = plainText(value);
      }
    } else if (tier && line && !line.startsWith('#') && !line.startsWith('<!--')) {
      text.push(line.replace(/^>\s?/, ''));
    }
  }
  flush();
  return tiers;
}
