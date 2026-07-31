import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogListPageComponent } from './blog-list-page.component';
import { BlogService } from '../services/blog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

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

  it('should format date correctly', () => {
    const date = new Date('2025-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('2025');
  });
});
