import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IgxButtonModule, IgxRippleModule, IgxIconModule, IgxInputGroupModule, IGX_CARD_DIRECTIVES } from 'igniteui-angular';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog-post.model';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-blog-list-page',
  standalone: true,
  imports: [
    RouterModule,
    NgOptimizedImage,
    FormsModule,
    IgxButtonModule,
    IgxRippleModule,
    IgxIconModule,
    IgxInputGroupModule,
    IGX_CARD_DIRECTIVES
],
  templateUrl: './blog-list-page.component.html',
  styleUrls: ['./blog-list-page.component.scss']
})
export class BlogListPageComponent implements OnInit {
  allBlogs: BlogPost[] = [];
  filteredBlogs: BlogPost[] = [];
  searchText = '';

  constructor(
    private blogService: BlogService,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Блог - 3D Печат България',
      description: 'Научете всичко за 3D принтирането - ръководства, съвети и трикове от експерти. Блог за 3D принтиране в България.',
      keywords: '3D принтиране, блог, ръководства, съвети, 3D принтер, България',
      url: 'https://3dpechat.bg/blog/',
      type: 'website'
    });
    this.seoService.removeStructuredData();
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getAllPosts().subscribe(blogs => {
      this.allBlogs = blogs.sort((a, b) => b.date.getTime() - a.date.getTime());
      this.filteredBlogs = [...this.allBlogs];
    });
  }

  onSearch(): void {
    const searchLower = this.searchText.toLowerCase().trim();

    if (!searchLower) {
      this.filteredBlogs = [...this.allBlogs];
      return;
    }

    this.filteredBlogs = this.allBlogs.filter(blog =>
      blog.title.toLowerCase().includes(searchLower) ||
      blog.description.toLowerCase().includes(searchLower) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  clearSearch(): void {
    this.searchText = '';
    this.onSearch();
  }

  get resultCount(): number {
    return this.filteredBlogs.length;
  }

  get totalCount(): number {
    return this.allBlogs.length;
  }

  searchByTag(event: Event, tag: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.searchText = tag;
    this.onSearch();
    // Scroll to top to show search results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
