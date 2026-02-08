import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { IgxCardModule, IgxButtonModule, IgxRippleModule, IgxIconModule, IgxInputGroupModule } from 'igniteui-angular';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog-post.model';

@Component({
  selector: 'app-blog-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IgxCardModule,
    IgxButtonModule,
    IgxRippleModule,
    IgxIconModule,
    IgxInputGroupModule
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
    private meta: Meta,
    private title: Title
  ) {
    this.title.setTitle('Блог - 3D Печат България');
    this.meta.addTags([
      { name: 'description', content: 'Научете всичко за 3D принтирането - ръководства, съвети и трикове от експерти. Блог за 3D принтиране в България.' },
      { name: 'keywords', content: '3D принтиране, блог, ръководства, съвети, 3D принтер, България' }
    ]);
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

  searchByTag(event: Event, tag: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.searchText = tag;
    this.onSearch();
    // Scroll to top to show search results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
