import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import productsData from '../../../data/products.json';
import { FAQ, MonetnaKartaBulgarskiEvroMonetiComponent } from './monetna-karta-bulgarski-evro-moneti.component';

describe('MonetnaKartaBulgarskiEvroMonetiComponent', () => {
  let fixture: ComponentFixture<MonetnaKartaBulgarskiEvroMonetiComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonetnaKartaBulgarskiEvroMonetiComponent],
      providers: [provideRouter([]), provideMarkdown()],
    }).compileComponents();
    fixture = TestBed.createComponent(MonetnaKartaBulgarskiEvroMonetiComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('links to every one of the five coin card products', () => {
    const md = fixture.componentInstance.postContent;
    for (let n = 1; n <= 5; n++) {
      expect(md).toContain(`/products/#variant-${n}`);
      expect((productsData as { linkId: string }[]).some(p => p.linkId === `variant-${n}`)).toBeTrue();
    }
  });

  it('has an alt text on every image', () => {
    const images = fixture.componentInstance.postContent.match(/!\[[^\]]*\]\([^)]+\)/g) ?? [];
    expect(images.length).toBeGreaterThanOrEqual(6);
    images.forEach(img => expect(img).not.toMatch(/^!\[\s*\]/));
  });

  it('answers every FAQ question in the visible article (JSON-LD stays in sync)', () => {
    const md = fixture.componentInstance.postContent;
    FAQ.forEach(({ question, answer }) => {
      expect(md).toContain(question);
      expect(md).toContain(answer);
    });
  });

  it('never ships the raw MakerWorld placeholder', () => {
    const md = fixture.componentInstance.postContent;
    expect(md).not.toContain('{{MAKERWORLD_URL}}');
    expect(md).not.toContain('<!-- makerworld -->');
  });

  it('links the live MakerWorld model', () => {
    expect(fixture.componentInstance.postContent).toContain('https://makerworld.com/en/models/3435823-coin-card-holder-bulgaria-euro');
  });

  it('builds the chrome from Ignite UI components', () => {
    expect(el.querySelector('button[igxButton]')).toBeTruthy();
    expect(el.querySelector('a[igxButton]')).toBeTruthy();
    expect(el.querySelector('igx-icon')).toBeTruthy();
  });
});
