import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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

  it('has one H1, an intro and a caption under each section heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('h1').length).toBe(1);
    expect(el.querySelector('.portfolio-intro p')?.textContent?.trim().length).toBeGreaterThan(100);
    const h2s = el.querySelectorAll('h2');
    expect(h2s.length).toBeGreaterThanOrEqual(2);
    expect(el.querySelectorAll('.portfolio-caption').length).toBe(h2s.length);
  });

  it('links to prices and contact from the intro', () => {
    const hrefs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.portfolio-intro a'),
    ).map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/prices', '/contact']);
  });
});
