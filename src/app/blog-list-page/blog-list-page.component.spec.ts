import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogListPageComponent } from './blog-list-page.component';
import { BlogService } from '../services/blog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import registry from '../../i18n/locales.json';
import { I18nService } from '../i18n/i18n.service';
import { BLOG_POSTS } from '../services/blog-posts.registry';
import { AnalyticsService } from '../services/analytics.service';

describe('BlogListPageComponent', () => {
  let component: BlogListPageComponent;
  let fixture: ComponentFixture<BlogListPageComponent>;
  let blogService: jasmine.SpyObj<BlogService>;

  const mockBlogs = [
    {
      id: '1',
      title: 'Test Blog 1',
      description: 'Test Description 1',
      slug: 'test-blog-1',
      route: '/blog/test-blog-1',
      date: new Date('2025-01-15'),
      tags: ['test', '3D']
    },
    {
      id: '2',
      title: 'Test Blog 2',
      description: 'Test Description 2',
      slug: 'test-blog-2',
      route: '/blog/test-blog-2',
      date: new Date('2025-01-10'),
      tags: ['guide']
    }
  ];

  beforeEach(async () => {
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getAllPosts']);

    await TestBed.configureTestingModule({
      imports: [BlogListPageComponent],
      providers: [
        { provide: BlogService, useValue: blogServiceSpy },
        provideRouter([]),
        // igxTooltip injects AnimationBuilder; noop satisfies it without
        // running real animations in the test.
        provideNoopAnimations(),
        Title,
        Meta
      ]
    }).compileComponents();

    blogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    blogService.getAllPosts.and.returnValue(of(mockBlogs));

    fixture = TestBed.createComponent(BlogListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blogs on init', () => {
    expect(component.allBlogs.length).toBe(2);
    expect(component.filteredBlogs.length).toBe(2);
  });

  it('should filter blogs by search text', () => {
    component.searchText = 'Test Blog 1';
    component.onSearch();
    expect(component.filteredBlogs.length).toBe(1);
    expect(component.filteredBlogs[0].title).toBe('Test Blog 1');
  });

  it('should filter blogs by tags', () => {
    component.searchText = '3D';
    component.onSearch();
    expect(component.filteredBlogs.length).toBe(1);
    expect(component.filteredBlogs[0].id).toBe('1');
  });

  it('should show all blogs when search is cleared', () => {
    component.searchText = 'Test';
    component.onSearch();
    component.clearSearch();
    expect(component.searchText).toBe('');
    expect(component.filteredBlogs.length).toBe(2);
  });

  it('reports a typed search to GA (which waits for a pause) with its result count', () => {
    const search = spyOn(TestBed.inject(AnalyticsService), 'search');
    component.searchText = 'Test Blog 1';
    component.onSearchInput();

    expect(component.filteredBlogs.length).toBe(1);
    expect(search).toHaveBeenCalledOnceWith('Test Blog 1', 1, 'blog');
  });

  it('reports a tag click to GA at once', () => {
    const search = spyOn(TestBed.inject(AnalyticsService), 'search');
    spyOn(window, 'scrollTo');
    component.searchByTag(new Event('click'), 'guide');

    expect(search).toHaveBeenCalledOnceWith('guide', 1, 'blog_tag', true);
  });

  it('should format date correctly', () => {
    const date = new Date('2025-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('2025');
  });
});

describe('BlogListPageComponent in English (/en/blog/)', () => {
  let fixture: ComponentFixture<BlogListPageComponent>;
  let el: HTMLElement;
  const english = registry.translatedPosts.en as Record<string, string>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogListPageComponent],
      providers: [provideRouter([]), provideNoopAnimations(), Title, Meta]
    }).compileComponents();
    await TestBed.inject(I18nService).use('en');
    fixture = TestBed.createComponent(BlogListPageComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => document.documentElement.setAttribute('lang', 'bg'));

  it('lists exactly the posts translated into English, at their English URLs', () => {
    const hrefs = Array.from(el.querySelectorAll('[data-testid="blog-card"]')).map((a) => a.getAttribute('href'));
    expect(hrefs.sort()).toEqual(Object.values(english).map((slug) => `/en/blog/${slug}`).sort());
    expect(el.querySelector('h1')?.textContent).toContain('3D Printing Blog');
  });

  it('points to the posts that are only in Bulgarian with one Ignite card', () => {
    const card = el.querySelector('igx-card[data-testid="blog-more-in-bulgarian"]');
    expect(card).not.toBeNull();
    expect(card!.querySelector('igx-card-header igx-avatar')).withContext('icon').not.toBeNull();
    expect(card!.querySelector('[igxCardHeaderTitle]')?.textContent).toContain('More articles in Bulgarian');
    const count = BLOG_POSTS.length - Object.keys(english).length;
    expect(card!.textContent).toContain(`${count} more articles are only in Bulgarian for now.`);
    const link = card!.querySelector<HTMLAnchorElement>('igx-card-actions a[igxButton]')!;
    expect(link.getAttribute('href')).toBe('/blog');
    expect(link.getAttribute('hreflang')).toBe('bg');
  });

  it('applies the English meta and hreflang of the blog index', () => {
    expect(TestBed.inject(Title).getTitle()).toBe('3D Printing Blog – Guides and Tips | 3dpechat.bg');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://3dpechat.bg/en/blog/');
    expect(document.querySelector('link[rel="alternate"][hreflang="bg"]')?.getAttribute('href')).toBe('https://3dpechat.bg/blog/');
  });
});
