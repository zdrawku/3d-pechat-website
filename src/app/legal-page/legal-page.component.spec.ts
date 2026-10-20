import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';

import { LegalPageComponent } from './legal-page.component';
import { LegalDoc, parseLegalText } from './legal-docs';
import { I18nService } from '../i18n/i18n.service';

const SAMPLE = parseLegalText([
  '- `person` Сайтът 3dpechat.bg се поддържа от Здравко Колев, физическо лице в София.',
  '- `delete_sweep` Изтриваме всичко до 7 дни след поръчката.',
  '## Кой обработва данните {#controller}',
  'Текст с **удебелено** и [връзка](https://www.cpdp.bg/).',
  '## Бисквитки {#cookies}',
  '- _ga'
].join('\n'));

describe('LegalPageComponent', () => {
  let fixture: ComponentFixture<LegalPageComponent>;
  let host: HTMLElement;

  async function create(doc: LegalDoc, locale: 'bg' | 'en' = 'bg'): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LegalPageComponent],
      providers: [
        provideRouter([]),
        provideMarkdown(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { doc, legalText: SAMPLE } } } }
      ]
    }).compileComponents();
    if (locale !== 'bg') {
      await TestBed.inject(I18nService).use(locale);
    }
    fixture = TestBed.createComponent(LegalPageComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => document.documentElement.setAttribute('lang', 'bg'));

  // Approved design „B“: the summary is an Ignite info card. Locks it to Ignite UI.
  it('builds the summary from Ignite UI components', async () => {
    await create('privacy');
    const card = host.querySelector('[data-testid="legal-summary"]')!;
    expect(card.tagName.toLowerCase()).toBe('igx-card');
    const header = card.querySelector('igx-card-header')!;
    expect(header.querySelector('igx-avatar')).withContext('igx-avatar').not.toBeNull();
    expect(header.querySelector('[igxCardHeaderTitle]')?.textContent?.trim()).toBe('Накратко');
    const points = card.querySelectorAll('igx-card-content li');
    expect(points.length).toBe(2);
    expect(points[0].querySelector('igx-icon')?.textContent?.trim()).toBe('person');
    expect(points[0].textContent).toContain('Здравко Колев');
  });

  it('has one H1, the page title, and its meta title', async () => {
    await create('privacy');
    const h1s = host.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent?.trim()).toBe('Политика за поверителност');
    expect(TestBed.inject(Title).getTitle()).toContain('Политика за поверителност');
  });

  it('numbers the sections, gives each its anchor and links them from the contents', async () => {
    await create('privacy');
    const sections = host.querySelectorAll<HTMLElement>('section.legal_section');
    expect([...sections].map((s) => s.id)).toEqual(['controller', 'cookies']);
    expect(sections[0].querySelector('h2')?.textContent?.trim()).toBe('1. Кой обработва данните');
    expect(sections[0].querySelector('markdown strong')?.textContent).toBe('удебелено');

    const links = host.querySelectorAll<HTMLAnchorElement>('[data-testid="legal-contents"] a');
    expect([...links].map((a) => a.getAttribute('href'))).toEqual(['/#controller', '/#cookies']);
  });

  it('shows the hand-maintained date, in the page language', async () => {
    await create('terms');
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Общи условия');
    expect(host.querySelector('[data-testid="legal-updated"]')?.textContent).toContain('2026');
  });

  it('speaks English on English pages', async () => {
    await create('terms', 'en');
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('Terms of Use');
    expect(host.querySelector('[igxCardHeaderTitle]')?.textContent?.trim()).toBe('In short');
    expect(host.querySelector('[data-testid="legal-updated"]')?.textContent).toMatch(/^Last updated: \w+ \d+, 2026$/);
  });
});
