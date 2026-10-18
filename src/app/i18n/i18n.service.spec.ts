import { Component } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { I18nService, interpolate } from './i18n.service';
import { LocalizePathPipe, TranslatePipe } from './translate.pipe';
import homeMessages from '../../i18n/bg/home.json';

@Component({
  imports: [TranslatePipe, LocalizePathPipe],
  template: `<h1>{{ 'shell.navbar.brandFull' | t }}</h1>
             <p>{{ 'misc.video.play' | t: { title: 'X' } }}</p>
             <span>{{ '/prices' | localizePath }}</span>`
})
class HostComponent { }

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg'));

  it('starts in Bulgarian with the core strings, no loading needed', () => {
    expect(i18n.locale()).toBe('bg');
    expect(i18n.t('shell.navbar.menu')).toBe('Меню');
    // Bulgarian content is src/data/ itself: no overlays.
    expect(i18n.content().faq).toEqual([]);
  });

  it('adds a page’s Bulgarian strings when the page registers them', () => {
    // Before the page registers, a page key has no Bulgarian text yet.
    expect(i18n.t('home.hero.title')).toBe('home.hero.title');
    i18n.registerPage('home', homeMessages);
    expect(i18n.t('home.hero.title')).toBe('Професионален 3D печат и 3D принтиране по поръчка');
    // Registering twice is harmless.
    i18n.registerPage('home', homeMessages);
    expect(i18n.t('home.cta.call')).toBe('Обади се сега');
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(i18n.t('misc.video.play', { title: 'X' })).toBe('Пусни видеото: X');
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });

  it('switches language, loading it on demand, and sets <html lang>', async () => {
    await i18n.use('en');
    expect(i18n.locale()).toBe('en');
    expect(i18n.definition().ogLocale).toBe('en_US');
    expect(i18n.t('shell.navbar.menu')).toBe('Menu');
    // A translation ships every namespace, pages included.
    expect(i18n.t('home.hero.title')).toBe('Professional custom 3D printing');
    expect(i18n.content().faq.length).toBeGreaterThan(0);
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('lang')).toBe('en');

    await i18n.use('bg');
    expect(i18n.t('shell.navbar.menu')).toBe('Меню');
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('lang')).toBe('bg');
  });

  it('picks the plural form by the language’s rules', async () => {
    expect(i18n.plural('reviews.count', 1)).toBe('1 ревю');
    expect(i18n.plural('reviews.count', 8)).toBe('8 ревюта');
    await i18n.use('en');
    expect(i18n.plural('reviews.count', 1)).toBe('1 review');
    expect(i18n.plural('reviews.count', 8)).toBe('8 reviews');
  });

  it('formats numbers, lists and month names for the language', async () => {
    const twoDecimals = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    expect(i18n.formatNumber(0.8, twoDecimals)).toBe('0,80');
    expect(i18n.formatList(['STL', '3MF', 'OBJ', 'STEP'], 'disjunction')).toBe('STL, 3MF, OBJ или STEP');
    expect(i18n.monthName(5)).toBe('май');

    await i18n.use('en');
    expect(i18n.formatNumber(0.8, twoDecimals)).toBe('0.80');
    expect(i18n.formatList(['STL', 'OBJ'], 'disjunction')).toBe('STL or OBJ');
    expect(i18n.monthName(5)).toBe('May');
    expect(i18n.weekdayName('Monday')).toBe('Mon');
  });

  it('localizes paths for the active language', async () => {
    expect(i18n.path('/contact')).toBe('/contact');
    await i18n.use('en');
    expect(i18n.path('/contact')).toBe('/en/contact');
    expect(i18n.path('/blog')).toBe('/blog');
  });

  it('re-renders templates through the t and localizePath pipes when the language changes', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent).toBe('3D Печат услуги');
    expect(host.querySelector('p')?.textContent).toBe('Пусни видеото: X');
    expect(host.querySelector('span')?.textContent).toBe('/prices');

    await i18n.use('en');
    fixture.detectChanges();
    expect(host.querySelector('h1')?.textContent).toBe('3D printing services');
    expect(host.querySelector('p')?.textContent).toBe('Play the video: X');
    expect(host.querySelector('span')?.textContent).toBe('/en/prices');
  });
});
