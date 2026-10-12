import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { Standstrap3dPrintiranStoperZaSnoubordComponent } from './standstrap-3d-printiran-stoper-za-snoubord.component';

describe('Standstrap3dPrintiranStoperZaSnoubordComponent', () => {
  let fixture: ComponentFixture<Standstrap3dPrintiranStoperZaSnoubordComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Standstrap3dPrintiranStoperZaSnoubordComponent],
      providers: [provideRouter([]), provideMarkdown()],
    }).compileComponents();
    fixture = TestBed.createComponent(Standstrap3dPrintiranStoperZaSnoubordComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('splits the article around the video marker', () => {
    const c = fixture.componentInstance;
    expect(c.postContent).toContain('## На пистата');
    expect(c.postContentAfterVideo).toContain('## Искате един StandStrap?');
    expect(c.postContent).not.toContain('<!-- video -->');
  });

  it('embeds the self-hosted clip lazily', () => {
    const video = el.querySelector<HTMLVideoElement>('[data-testid="standstrap-video"]')!;
    expect(video).toBeTruthy();
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.querySelector('source')!.getAttribute('src')).toBe('assets/blogs/videos/standstrap-na-pistata.mp4');
  });

  it('credits Gripsta and links to the product card and MakerWorld', () => {
    const md = fixture.componentInstance.postContent + fixture.componentInstance.postContentAfterVideo;
    expect(md).toContain('https://gripsta.com/');
    expect(md).toContain('/products/#standstrap-stoper-za-snoubord');
    expect(md).toContain('https://makerworld.com/en/models/3427894-standstrap');
  });

  it('builds the chrome from Ignite UI components', () => {
    expect(el.querySelector('button[igxButton]')).toBeTruthy();
    expect(el.querySelector('igx-icon')).toBeTruthy();
  });
});
