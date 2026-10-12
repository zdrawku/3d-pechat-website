import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, UrlSerializer } from '@angular/router';

import { IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES } from 'igniteui-angular';
import { MainPageComponent } from './main-page.component';
import { TrailingSlashUrlSerializer } from '../trailing-slash-url-serializer';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageComponent, NoopAnimationsModule, FormsModule, ReactiveFormsModule, IgxButtonDirective, IGX_CAROUSEL_DIRECTIVES],
      providers: [provideRouter([]), { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The hero and final-CTA actions must be real links: Googlebot only follows
  // <a href>, and a (click) handler on a <button> left the homepage with no
  // crawlable path to /contact or /portfolio.
  it('exposes crawlable Ignite UI links to contact and portfolio', () => {
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = (selector: string) =>
      Array.from(el.querySelectorAll<HTMLAnchorElement>(selector)).map(a => a.getAttribute('href'));

    expect(hrefs('a[igxButton][href]')).toEqual(
      jasmine.arrayContaining(['/contact/', '/portfolio/'])
    );
    expect(el.querySelector('.hero_cta_row a.btn_primary')?.getAttribute('href')).toBe('/contact/');
    expect(el.querySelector('.hero_cta_row a.btn_ghost')?.getAttribute('href')).toBe('/portfolio/');
    expect(el.querySelector('.cta-band a.cta-band__btn[href="/contact/"]')).not.toBeNull();
    // (the carousel renders its own prev/next igxButton <button>s, so scope to the CTAs)
    expect(el.querySelectorAll('.hero_cta_row button, .cta-band button').length).toBe(0);
  });
});
