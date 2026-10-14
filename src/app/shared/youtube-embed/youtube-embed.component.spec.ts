import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { YoutubeEmbedComponent } from './youtube-embed.component';
import { FEATURED_VIDEO, formatDuration, videoObjectSchema, youtubeEmbedUrl } from './video.util';

describe('YoutubeEmbedComponent', () => {
  let fixture: ComponentFixture<YoutubeEmbedComponent>;
  let component: YoutubeEmbedComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoutubeEmbedComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(YoutubeEmbedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('video', FEATURED_VIDEO);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('builds the facade from Ignite UI components', () => {
    expect(host.querySelector('igx-card')).withContext('igx-card').not.toBeNull();
    expect(host.querySelector('igx-card-media')).withContext('igx-card-media').not.toBeNull();
    const play = host.querySelector('[data-testid="youtube-play"]');
    expect(play?.hasAttribute('igxIconButton')).withContext('play is an igxIconButton').toBeTrue();
    expect(play?.querySelector('igx-icon')?.textContent?.trim()).toBe('play_arrow');
  });

  it('does not wrap the play button in an image role (axe nested-interactive)', () => {
    expect(host.querySelector('igx-card-media')?.getAttribute('role')).toBe('none');
  });

  it('keeps the play button and length chip out of igx-card-media\'s 100% child sizing', () => {
    // Ignite stretches every direct child of .igx-card__media to the full box;
    // a stretched length chip would cover the poster with its dark scrim.
    const directChildren = Array.from(host.querySelector('igx-card-media')!.children).map((c) => c.className);
    expect(directChildren.some((c) => c.includes('video-card__duration'))).toBeFalse();
    expect(directChildren.some((c) => c.includes('video-card__play'))).toBeFalse();
    expect(host.querySelector('.video-card__overlay [data-testid="youtube-play"]')).not.toBeNull();
    expect(host.querySelector('.video-card__overlay .video-card__duration')).not.toBeNull();
  });

  it('renders no iframe before the visitor presses play (nothing loads from YouTube)', () => {
    expect(host.querySelector('iframe')).toBeNull();
  });

  it('shows the self-hosted poster lazily, with alt text and fixed dimensions', () => {
    const img = host.querySelector<HTMLImageElement>('img.video-card__poster')!;
    expect(img.getAttribute('src')).toBe(FEATURED_VIDEO.poster);
    expect(img.getAttribute('src')).not.toContain('ytimg.com');
    expect(img.getAttribute('alt')).toBe(FEATURED_VIDEO.posterAlt);
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('width')).toBe('1280');
    expect(img.getAttribute('height')).toBe('720');
  });

  it('gives the play button a Bulgarian accessible name', () => {
    const play = host.querySelector('[data-testid="youtube-play"]')!;
    expect(play.getAttribute('aria-label')).toBe(`Пусни видеото: ${FEATURED_VIDEO.title}`);
  });

  it('shows the duration chip', () => {
    expect(host.querySelector('.video-card__duration')?.textContent?.trim()).toBe('1:01');
  });

  it('swaps in a privacy-enhanced, autoplaying iframe on click', () => {
    host.querySelector<HTMLButtonElement>('[data-testid="youtube-play"]')!.click();
    fixture.detectChanges();

    const frames = host.querySelectorAll('iframe');
    expect(frames.length).toBe(1);
    const src = frames[0].getAttribute('src')!;
    expect(src.startsWith(`https://www.youtube-nocookie.com/embed/${FEATURED_VIDEO.id}?`)).toBeTrue();
    expect(src).toContain('autoplay=1');
    expect(frames[0].getAttribute('title')).toBe(FEATURED_VIDEO.title);
    expect(frames[0].hasAttribute('allowfullscreen')).toBeTrue();
    expect(host.querySelector('[data-testid="youtube-play"]')).withContext('poster button removed').toBeNull();
  });

  it('plays when the poster itself is clicked', () => {
    host.querySelector<HTMLImageElement>('img.video-card__poster')!.click();
    fixture.detectChanges();
    expect(component.playing).toBeTrue();
    expect(host.querySelector('iframe')).not.toBeNull();
  });
});

describe('video.util', () => {
  it('formats ISO 8601 durations as player labels', () => {
    expect(formatDuration('PT1M1S')).toBe('1:01');
    expect(formatDuration('PT45S')).toBe('0:45');
    expect(formatDuration('PT1H2M3S')).toBe('1:02:03');
    expect(formatDuration('nonsense')).toBe('');
  });

  it('builds nocookie embed URLs', () => {
    expect(youtubeEmbedUrl('abc')).toBe('https://www.youtube-nocookie.com/embed/abc?rel=0&playsinline=1');
    expect(youtubeEmbedUrl('abc', true)).toContain('autoplay=1');
  });

  it('describes the video as a schema.org VideoObject tied to the Organization', () => {
    const schema = videoObjectSchema(FEATURED_VIDEO);
    expect(schema['@type']).toBe('VideoObject');
    expect(schema['uploadDate']).toBe(FEATURED_VIDEO.uploadDate);
    expect(schema['duration']).toBe('PT1M1S');
    expect(schema['contentUrl']).toBe(`https://www.youtube.com/watch?v=${FEATURED_VIDEO.id}`);
    expect((schema['thumbnailUrl'] as string[])[0]).toBe(`https://3dpechat.bg/${FEATURED_VIDEO.poster}`);
    expect(schema['publisher']).toEqual({ '@id': 'https://3dpechat.bg/#organization' });
  });

  it('has exactly one featured video for the home page', () => {
    expect(FEATURED_VIDEO.id).toBe('f8yTuEcOCjU');
  });
});
