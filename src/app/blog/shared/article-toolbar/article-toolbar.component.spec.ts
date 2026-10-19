import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { I18nService } from '../../../i18n/i18n.service';
import { ArticleToolbarComponent } from './article-toolbar.component';

describe('ArticleToolbarComponent', () => {
  let fixture: ComponentFixture<ArticleToolbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ArticleToolbarComponent], providers: [provideRouter([])] });
  });

  afterEach(() => document.documentElement.setAttribute('lang', 'bg'));

  function render(slug: string): HTMLElement {
    fixture = TestBed.createComponent(ArticleToolbarComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('builds the row from Ignite UI components', () => {
    const el = render('pla-pla-pla-pro-i-pln-razliki-i-izbor');
    expect(el.querySelector('a[igxButton="outlined"].back-button igx-icon')).withContext('back link').not.toBeNull();
    expect(el.querySelector('a[igxButton="flat"].language-link igx-icon')).withContext('language link').not.toBeNull();
    expect(el.querySelector('button')).withContext('links, not buttons: they navigate').toBeNull();
  });

  it('links a Bulgarian post back to the blog and to its English version', () => {
    const el = render('pla-pla-pla-pro-i-pln-razliki-i-izbor');
    const back = el.querySelector<HTMLAnchorElement>('[data-testid="article-back"]')!;
    expect(back.getAttribute('href')).toBe('/blog');
    expect(back.textContent).toContain('Назад към статиите');
    const language = el.querySelector<HTMLAnchorElement>('[data-testid="article-language-link"]')!;
    expect(language.getAttribute('href')).toBe('/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln');
    expect(language.getAttribute('hreflang')).toBe('en');
    expect(language.textContent).toContain('Прочетете на английски');
  });

  it('shows only the back link on a post that exists only in Bulgarian', () => {
    const el = render('what-is-3d-printing');
    expect(el.querySelector('[data-testid="article-back"]')).not.toBeNull();
    expect(el.querySelectorAll('[data-testid="article-language-link"]').length).toBe(0);
  });

  it('links an English post back to the English blog and to its Bulgarian original', async () => {
    await TestBed.inject(I18nService).use('en');
    const el = render('pla-pla-pla-pro-i-pln-razliki-i-izbor');
    expect(el.querySelector('[data-testid="article-back"]')?.getAttribute('href')).toBe('/en/blog');
    const language = el.querySelector<HTMLAnchorElement>('[data-testid="article-language-link"]')!;
    expect(language.getAttribute('href')).toBe('/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor');
    expect(language.getAttribute('hreflang')).toBe('bg');
    expect(language.textContent?.trim()).toContain('Read in Bulgarian');
  });
});
