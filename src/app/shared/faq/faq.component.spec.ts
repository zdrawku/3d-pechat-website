import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FAQ, FaqComponent } from './faq.component';

describe('FaqComponent', () => {
  let fixture: ComponentFixture<FaqComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FaqComponent] }).compileComponents();
    fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('renders every faq.json entry, question and answer, always visible', () => {
    const cards = el.querySelectorAll('.faq__grid > li');
    expect(cards.length).toBe(FAQ.length);
    FAQ.forEach((item, i) => {
      expect(cards[i].id).toBe(`faq-${item.id}`);
      expect(cards[i].querySelector('h3')?.textContent?.trim()).toBe(item.question);
      expect(cards[i].querySelector('p')?.textContent?.trim()).toBe(item.answer);
    });
  });

  it('builds the section from Ignite UI components', () => {
    expect(el.querySelectorAll('igx-card').length).toBe(FAQ.length);
    expect(el.querySelectorAll('igx-card igx-card-content').length).toBe(FAQ.length);
    expect(el.querySelectorAll('igx-card igx-icon').length).toBe(FAQ.length);
  });

  it('is an anchored, labelled section with one heading', () => {
    const section = el.querySelector('section#faq');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-labelledby')).toBe('faq-title');
    expect(el.querySelector('h2#faq-title')?.textContent).toContain('Често задавани въпроси');
  });
});
