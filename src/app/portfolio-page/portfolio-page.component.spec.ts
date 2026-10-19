import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';
import englishGallery from '../../i18n/en/content/gallery.json';
import { carouselImages } from './carousel-images';
import { PortfolioPageComponent } from './portfolio-page.component';

describe('PortfolioPageComponent', () => {
  let component: PortfolioPageComponent;
  let fixture: ComponentFixture<PortfolioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioPageComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('gives the photo wall English alt text on the English page, Bulgarian on the Bulgarian one', async () => {
    const first = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img.masonry-image')!;
    const src = first().getAttribute('src')!;
    expect(first().alt).toBe(carouselImages.find(i => i.src === src)!.alt);
    expect(first().hasAttribute('lang')).toBeFalse();

    await TestBed.inject(I18nService).use('en');
    fixture.detectChanges();
    expect(first().alt).toBe((englishGallery as Record<string, string>)[src]);
    expect(first().hasAttribute('lang')).withContext('translated: no lang="bg"').toBeFalse();
    TestBed.inject(DOCUMENT).documentElement.setAttribute('lang', 'bg');
  });

  it('has one H1, an intro and a caption under each section heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('.portfolio-intro p')?.textContent?.trim().length).toBeGreaterThan(100);
    const h2s = el.querySelectorAll('h2');
    expect(h2s.length).toBeGreaterThanOrEqual(2);
    expect(el.querySelectorAll('.portfolio-caption').length).toBe(h2s.length);
  });

  it('puts the quote CTA inside the photo wall after ~4 rows (4, 9, 13 photos; one per column count)', () => {
    const gallery = (fixture.nativeElement as HTMLElement).querySelector('.masonry-gallery')!;
    const children = Array.from(gallery.children);
    const bands = gallery.querySelectorAll<HTMLElement>('[data-testid="portfolio-cta"]');
    expect(Array.from(bands, b => b.dataset['after'])).toEqual(['4', '9', '13']);

    bands.forEach(band => {
      const photosBefore = children.slice(0, children.indexOf(band))
        .filter(el => el.classList.contains('masonry-item')).length;
      expect(photosBefore).withContext(`photos before band ${band.dataset['after']}`).toBe(Number(band.dataset['after']));
    });
  });

  it('links to contact and prices from the CTA with Ignite UI buttons', () => {
    const band = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="portfolio-cta"]')!;
    const links = Array.from(band.querySelectorAll<HTMLAnchorElement>('a'));
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/contact', '/prices']);
    links.forEach(a => {
      expect(a.hasAttribute('igxButton')).withContext('styled via igxButton').toBeTrue();
      expect(a.querySelector('igx-icon')).withContext('igx-icon').not.toBeNull();
    });
  });
});
