import { ComponentFixture, TestBed } from '@angular/core/testing';

import roadmapMarkdown from '../../../../../ROADMAP.md';
import { ROADMAP_IMPACTS, parseRoadmap, plainText } from './roadmap';
import { StudioRoadmapComponent } from './studio-roadmap.component';

const SAMPLE = `# Roadmap

Intro that belongs to no tier.

## Now: high impact, ready to start

> Start here.

### Per-picture palettes
- Area: Bookmarks
- **Impact:** High
- Effort: 1–2 days
- Status: Waiting on engine 0.2.0
- Details: [Contract §1.10](BOOKMARKS-ENGINE-CONTRACT.md#110)

Each bookmark in a set gets **its own** palette, see [the plan](BOOKMARKS-PLAN.md).
Second line.

## Later: nice to have

### Gift box
- Area: Catalogue
- Impact: Low

A box.
`;

describe('parseRoadmap', () => {
  it('reads tiers, items, their fields and plain-text descriptions', () => {
    const tiers = parseRoadmap(SAMPLE);
    expect(tiers.map(t => t.key)).toEqual(['now', 'later']);
    expect(tiers[0].title).toBe('Now: high impact, ready to start');
    expect(tiers[0].description).toBe('Start here.');
    expect(tiers[0].items[0]).toEqual({
      title: 'Per-picture palettes',
      area: 'Bookmarks',
      impact: 'High',
      effort: '1–2 days',
      status: 'Waiting on engine 0.2.0',
      details: { label: 'Contract §1.10', href: 'BOOKMARKS-ENGINE-CONTRACT.md#110' },
      description: 'Each bookmark in a set gets its own palette, see the plan. Second line.'
    });
    expect(tiers[1].items[0].details).toBeNull();
  });

  it('turns inline Markdown into plain text', () => {
    expect(plainText('**a** [b](c) `d`')).toBe('a b d');
  });
});

describe('ROADMAP.md', () => {
  const tiers = parseRoadmap(roadmapMarkdown);
  const items = tiers.flatMap(t => t.items);

  it('has tiers, each with items', () => {
    expect(tiers.length).toBeGreaterThan(1);
    tiers.forEach(t => expect(t.items.length).withContext(t.title).toBeGreaterThan(0));
  });

  it('gives every item an area, a known impact, a status and a description', () => {
    for (const item of items) {
      expect(item.area).withContext(item.title).not.toBe('');
      expect(ROADMAP_IMPACTS).withContext(item.title).toContain(item.impact);
      expect(item.status).withContext(item.title).not.toBe('');
      expect(item.description.length).withContext(item.title).toBeGreaterThan(20);
    }
  });

  it('links details only to repo files, never to a local or absolute path', () => {
    for (const item of items.filter(i => i.details)) {
      expect(item.details!.href).withContext(item.title).toMatch(/^[A-Z][\w.-]*\.md(#[\p{L}\p{N}_-]+)?$/u);
    }
  });
});

describe('StudioRoadmapComponent', () => {
  let fixture: ComponentFixture<StudioRoadmapComponent>;
  const host = (): HTMLElement => fixture.nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StudioRoadmapComponent] }).compileComponents();
    fixture = TestBed.createComponent(StudioRoadmapComponent);
    fixture.detectChanges();
  });

  it('builds the roadmap from Ignite UI components', () => {
    const cards = host().querySelectorAll('[data-testid="roadmap-item"]');
    expect(cards.length).toBe(parseRoadmap(roadmapMarkdown).flatMap(t => t.items).length);
    cards.forEach(card => expect(card.tagName.toLowerCase()).toBe('igx-card'));
    host().querySelectorAll('[data-testid="roadmap-area"] button').forEach(b => expect(b.classList).toContain('igx-button')); // a bound [igxButton] leaves no attribute
    expect(host().querySelector('.tier-title igx-icon')).not.toBeNull();
    host().querySelectorAll('igx-card-actions a').forEach(a => {
      expect(a.hasAttribute('igxButton')).toBeTrue();
      expect(a.getAttribute('href')).toMatch(/^https:\/\/github\.com\/zdrawku\/3d-pechat-website\/blob\/main\//);
    });
  });

  it('filters by area', () => {
    const buttons = host().querySelectorAll<HTMLButtonElement>('[data-testid="roadmap-area"] button');
    const total = host().querySelectorAll('[data-testid="roadmap-item"]').length;
    buttons[1].click();
    fixture.detectChanges();
    const area = buttons[1].textContent!.trim();
    const shown = host().querySelectorAll('[data-testid="roadmap-item"]');
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.length).toBeLessThan(total);
    shown.forEach(card => expect(card.querySelector('[igxCardHeaderSubtitle]')!.textContent!.trim()).toBe(area));
  });
});
