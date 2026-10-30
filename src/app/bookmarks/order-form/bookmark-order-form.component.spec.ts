import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { BookmarkOrderFormComponent } from './bookmark-order-form.component';
import { createBookmarkEngine } from '../engine/stub-engine';
import type { BookmarkEngine, BookmarkRequest } from '../engine/engine.types';
import { BUSINESS } from '../../../data/business';
import { AnalyticsService } from '../../services/analytics.service';
import { I18nService } from '../../i18n/i18n.service';
import bookmarksMessages from '../../../i18n/bg/bookmarks.json';

const REQUEST: BookmarkRequest = {
  mode: 'pattern',
  pattern: { id: 'waves', style: 'cut' },
  shape: 'rectangle',
  size: '40x160',
  colours: ['#c13a0b', '#f0a46b'],
  hole: 'top',
  names: [],
  namePlace: 'middle'
};

/** The members the specs reach into (they are protected in the component). */
interface Internals {
  name: string;
  email: string;
  phone: string;
  quantity: number;
  notes: string;
  captchaToken: string;
  submit(): Promise<void>;
  status(): string;
}

describe('BookmarkOrderFormComponent', () => {
  let engine: BookmarkEngine;
  let fixture: ComponentFixture<BookmarkOrderFormComponent>;
  let fetchSpy: jasmine.Spy;

  const host = (): HTMLElement => fixture.nativeElement;
  const form = (): Internals => fixture.componentInstance as unknown as Internals;
  const status = (): string => host().querySelector('[data-testid="bookmark-order-status"]')!.textContent!.trim();

  function fillIn(): void {
    const f = form();
    f.name = 'Мария Иванова';
    f.email = 'maria@example.com';
    f.phone = '0888123456';
    f.quantity = 2;
    f.notes = 'За подарък';
    f.captchaToken = 'captcha-ok';
  }

  async function submit(): Promise<void> {
    await form().submit();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    engine = await createBookmarkEngine();
    await TestBed.configureTestingModule({
      imports: [BookmarkOrderFormComponent],
      providers: [provideRouter([]), provideNoopAnimations()]
    }).compileComponents();

    // The page that hosts the form registers its strings; stand in for it.
    TestBed.inject(I18nService).registerPage('bookmarks', bookmarksMessages);
    fixture = TestBed.createComponent(BookmarkOrderFormComponent);
    fixture.componentRef.setInput('request', REQUEST);
    fixture.componentRef.setInput('engine', engine);
    fixture.componentRef.setInput('orderMaxBytes', 1024 * 1024);
    fixture.detectChanges();

    fetchSpy = spyOn(window, 'fetch').and.resolveTo({ json: () => Promise.resolve({ success: true }) } as Response);
  });

  it('builds the form from Ignite UI components', () => {
    expect(host().querySelector('igx-card')).not.toBeNull();
    expect(host().querySelectorAll('igx-input-group').length).withContext('name, email, phone, quantity, notes').toBe(5);
    expect(host().querySelector('button[igxButton="contained"]')).not.toBeNull();
    expect(host().querySelector('igx-icon')).not.toBeNull();
  });

  it('says the price is confirmed by email and the time from business.json', () => {
    expect(host().querySelector('[data-testid="bookmark-order-price-note"]')!.textContent).toContain('Ще потвърдим цената по имейл');
    const time = host().querySelector('[data-testid="bookmark-order-time-note"]')!.textContent!;
    expect(time).toContain(BUSINESS.leadTimeWorkingDays.largeOrSeries);
    expect(time).toContain('натоварването и приоритета');
  });

  it('asks for the missing fields and the captcha before sending anything', async () => {
    await submit();
    expect(status()).toContain('Попълнете');

    fillIn();
    form().captchaToken = '';
    await submit();
    expect(status()).toContain('не сте робот');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses to order while there is no design yet (a picture is missing)', async () => {
    fixture.componentRef.setInput('request', null);
    fixture.detectChanges();
    fillIn();
    await submit();
    expect(status()).toContain('снимка');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the order file as the only attachment and its summary as the email body', async () => {
    const created = await engine.createOrder(REQUEST, { name: '', email: '', phone: '', quantity: 1, notes: '', locale: 'bg' });
    spyOn(engine, 'createOrder').and.resolveTo(created);
    const track = spyOn(TestBed.inject(AnalyticsService), 'track');

    fillIn();
    await submit();

    expect(engine.createOrder).toHaveBeenCalledWith(REQUEST, jasmine.objectContaining({
      name: 'Мария Иванова', email: 'maria@example.com', phone: '0888123456', quantity: 2, notes: 'За подарък', locale: 'bg'
    }), { container: 'json' });
    const [url, init] = fetchSpy.calls.mostRecent().args as [string, RequestInit];
    expect(url).toBe('https://api.web3forms.com/submit');
    const body = init.body as FormData;
    expect(body.get('message')).toBe(created.summary);
    expect(body.get('h-captcha-response')).toBe('captcha-ok');
    const attachments = body.getAll('attachment');
    expect(attachments.length).withContext('exactly one attachment').toBe(1);
    expect((attachments[0] as File).name).toBe(created.fileName);
    expect(track).toHaveBeenCalledWith('generate_lead', { lead_source: 'bookmark_order' });
    expect(status()).toContain('Поръчката е изпратена');
    expect(form().name).withContext('form is cleared').toBe('');
  });

  it('does not send an order file over the free plan’s size limit', async () => {
    fixture.componentRef.setInput('orderMaxBytes', 1);
    fixture.detectChanges();
    fillIn();
    await submit();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(status()).toContain('твърде голяма');
  });

  it('reports a failed send with the shop’s email, and does not count a lead', async () => {
    fetchSpy.and.resolveTo({ json: () => Promise.resolve({ success: false, message: 'refused' }) } as Response);
    const logged = spyOn(console, 'error');
    const track = spyOn(TestBed.inject(AnalyticsService), 'track');
    fillIn();
    await submit();
    expect(status()).toContain(BUSINESS.email);
    expect(track).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith('Web3Forms refused the bookmark order:', 'refused');

    fetchSpy.and.rejectWith(new Error('offline'));
    fillIn();
    await submit();
    expect(status()).toContain('не се изпрати');
  });
});
