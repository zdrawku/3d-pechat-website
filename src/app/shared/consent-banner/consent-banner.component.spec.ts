import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { ConsentBannerComponent } from './consent-banner.component';
import { CONSENT_STORAGE_KEY, ConsentService } from '../../services/consent.service';
import { I18nService } from '../../i18n/i18n.service';

describe('ConsentBannerComponent', () => {
  let fixture: ComponentFixture<ConsentBannerComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    await TestBed.configureTestingModule({
      imports: [ConsentBannerComponent],
      providers: [provideNoopAnimations(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsentBannerComponent);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    document.documentElement.setAttribute('lang', 'bg');
  });

  const card = () => host.querySelector('[data-testid="consent-card"]');
  const button = (id: string) => host.querySelector<HTMLButtonElement>(`[data-testid="consent-${id}"]`)!;

  // Approved design „B“ (FEATURE-IDEAS-PLAN.md): an igx-card with the info-card
  // header and two igxButtons. Locks it to Ignite UI so it can't regress to plain HTML.
  it('builds the card from Ignite UI components', () => {
    const igxCard = card()?.querySelector('igx-card');
    expect(igxCard).withContext('igx-card').not.toBeNull();
    const header = igxCard!.querySelector('igx-card-header')!;
    expect(header.querySelector('igx-avatar')).withContext('igx-avatar icon').not.toBeNull();
    expect(header.querySelector('[igxCardHeaderTitle]')?.textContent?.trim()).toBe('Бисквитки за статистика');
    expect(igxCard!.querySelector('igx-card-content p')?.textContent).toContain('Google Analytics');
    const actions = igxCard!.querySelectorAll('igx-card-actions button[igxButton="contained"]');
    expect(actions.length).withContext('two contained igxButtons').toBe(2);
  });

  it('offers both answers with equal weight, in one row', () => {
    expect(button('decline').textContent?.trim()).toBe('Отказвам');
    expect(button('accept').textContent?.trim()).toBe('Приемам');
    expect(button('decline').getAttribute('igxButton')).toBe(button('accept').getAttribute('igxButton'));
  });

  it('links „Повече за данните“ to the cookies section of the Privacy Policy', () => {
    const more = host.querySelector<HTMLAnchorElement>('[data-testid="consent-more"]')!;
    expect(more.textContent?.trim()).toBe('Повече за данните');
    expect(more.getAttribute('href')).toMatch(/^\/privacy\/?#cookies$/);
  });

  it('is a named region, so screen readers can find it', () => {
    const titleId = card()?.getAttribute('aria-labelledby');
    expect(card()?.tagName).toBe('SECTION');
    expect(host.querySelector(`#${titleId}`)?.textContent?.trim()).toBe('Бисквитки за статистика');
  });

  for (const answer of ['accept', 'decline']) {
    it(`closes on „${answer}“ and records the answer`, () => {
      button(answer).click();
      fixture.detectChanges();

      expect(card()).toBeNull();
      expect(TestBed.inject(ConsentService).analytics()).toBe(answer === 'accept' ? 'granted' : 'denied');
    });
  }

  it('comes back when reopened from the footer', () => {
    button('decline').click();
    fixture.detectChanges();
    TestBed.inject(ConsentService).reopen();
    fixture.detectChanges();
    expect(card()).not.toBeNull();
  });

  it('speaks English on English pages', async () => {
    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(card()?.querySelector('[igxCardHeaderTitle]')?.textContent?.trim()).toBe('Analytics cookies');
    expect(button('decline').textContent?.trim()).toBe('Decline');
    expect(button('accept').textContent?.trim()).toBe('Accept');
  });
});
