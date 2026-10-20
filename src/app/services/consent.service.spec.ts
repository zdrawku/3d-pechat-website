import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, ConsentService } from './consent.service';

type ConsentWindow = Window & { grantAnalytics?: jasmine.Spy; gtag?: jasmine.Spy };

describe('ConsentService', () => {
  const store = (analytics: string, at = Date.now()) =>
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics, at }));
  const stored = () => JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? 'null');
  const create = () => TestBed.inject(ConsentService);

  beforeEach(() => localStorage.removeItem(CONSENT_STORAGE_KEY));
  afterEach(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    delete (window as ConsentWindow).grantAnalytics;
    delete (window as ConsentWindow).gtag;
  });

  it('asks a first-time visitor (no answer, card visible)', () => {
    const consent = create();
    expect(consent.analytics()).toBeNull();
    expect(consent.answered()).toBeFalse();
    expect(consent.visible()).toBeTrue();
  });

  it('remembers an answer from an earlier visit', () => {
    store('granted');
    const consent = create();
    expect(consent.granted()).toBeTrue();
    expect(consent.visible()).toBeFalse();
  });

  it('asks again once the answer is older than 6 months, and ignores a corrupt value', () => {
    store('granted', Date.now() - CONSENT_MAX_AGE_MS - 1);
    expect(create().analytics()).toBeNull();

    TestBed.resetTestingModule();
    localStorage.setItem(CONSENT_STORAGE_KEY, '{not json');
    expect(create().analytics()).toBeNull();
  });

  it('„Приемам“ stores the answer and loads Google Analytics', () => {
    const grantAnalytics = jasmine.createSpy('grantAnalytics');
    (window as ConsentWindow).grantAnalytics = grantAnalytics;
    const consent = create();

    consent.accept();

    expect(grantAnalytics).toHaveBeenCalledTimes(1);
    expect(stored().analytics).toBe('granted');
    expect(Date.now() - stored().at).toBeLessThan(1000);
    expect(consent.visible()).toBeFalse();
  });

  it('„Отказвам“ stores the answer and loads nothing', () => {
    const grantAnalytics = jasmine.createSpy('grantAnalytics');
    (window as ConsentWindow).grantAnalytics = grantAnalytics;
    const consent = create();

    consent.decline();

    expect(grantAnalytics).not.toHaveBeenCalled();
    expect(stored().analytics).toBe('denied');
    expect(consent.granted()).toBeFalse();
    expect(consent.visible()).toBeFalse();
  });

  it('the footer button reopens the card, and withdrawing a yes stops GA and deletes its cookies', () => {
    store('granted');
    const gtag = jasmine.createSpy('gtag');
    (window as ConsentWindow).gtag = gtag;
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_YBR644GQL9=GS1.1.456; path=/';
    document.cookie = 'unrelated=keep; path=/';
    const consent = create();

    consent.reopen();
    expect(consent.visible()).toBeTrue();
    consent.decline();

    expect(gtag).toHaveBeenCalledOnceWith('consent', 'update', { analytics_storage: 'denied' });
    expect(document.cookie).not.toContain('_ga');
    expect(document.cookie).toContain('unrelated=keep');
    expect(consent.visible()).toBeFalse();
    document.cookie = 'unrelated=; Max-Age=0; path=/';
  });

  it('shows nothing and reads nothing during prerender', () => {
    store('granted');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const consent = create();
    expect(consent.visible()).toBeFalse();
    expect(consent.granted()).toBeFalse();
  });
});
