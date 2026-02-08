import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatIs3dPrintingComponent } from './what-is-3d-printing.component';
import { BlogService } from '../../services/blog.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

describe('WhatIs3dPrintingComponent', () => {
  let component: WhatIs3dPrintingComponent;
  let fixture: ComponentFixture<WhatIs3dPrintingComponent>;
  let blogService: jasmine.SpyObj<BlogService>;

  beforeEach(async () => {
    const blogServiceSpy = jasmine.createSpyObj('BlogService', ['getPost']);

    await TestBed.configureTestingModule({
      imports: [WhatIs3dPrintingComponent],
      providers: [
        { provide: BlogService, useValue: blogServiceSpy },
        provideRouter([]),
        Title,
        Meta
      ]
    }).compileComponents();

    blogService = TestBed.inject(BlogService) as jasmine.SpyObj<BlogService>;
    blogService.getPost.and.returnValue(of('# Test Content'));

    fixture = TestBed.createComponent(WhatIs3dPrintingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load blog post content on init', () => {
    expect(blogService.getPost).toHaveBeenCalledWith('what-is-3d-printing');
    expect(component.postContent).toBe('# Test Content');
  });

  it('should set page title', () => {
    const titleService = TestBed.inject(Title);
    expect(titleService.getTitle()).toBe('Какво представлява 3D принтирането? - Пълно ръководство 2026');
  });
});
