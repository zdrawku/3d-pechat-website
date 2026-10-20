import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IgxButtonModule, IgxRippleModule, IgxIconModule, IgxInputGroupModule, IGX_CARD_DIRECTIVES, IgxTooltipModule, IgxAvatarComponent } from 'igniteui-angular';
import blogMessages from '../../i18n/bg/blog.json';
import { I18nService } from '../i18n/i18n.service';
import { blogPostsIn } from '../i18n/localized-content';
import { TranslatePipe } from '../i18n/translate.pipe';
import { BlogService } from '../services/blog.service';
import { BlogPost } from '../models/blog-post.model';
import { SeoService } from '../services/seo.service';
import { AnalyticsService } from '../services/analytics.service';

/**
 * The blog index in every language: /blog/ lists every post, /en/blog/ the
 * posts translated into English (src/i18n/locales.json `translatedPosts`),
 * closed by one card pointing to the posts that are still only in Bulgarian
 * (approved design „B“, artifact "English Blog Variants").
 */
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
    IGX_CARD_DIRECTIVES,
    IgxTooltipModule,
    IgxAvatarComponent,
    TranslatePipe
],
  templateUrl: './blog-list-page.component.html',
  styleUrls: ['./blog-list-page.component.scss']
})
export class BlogListPageComponent implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly analytics = inject(AnalyticsService);

  allBlogs: BlogPost[] = [];
  filteredBlogs: BlogPost[] = [];
  searchText = '';
  /** Posts that exist only in Bulgarian, shown as one pointer card on another language's blog (0 on the Bulgarian one). */
  untranslatedCount = 0;

  constructor(
    private blogService: BlogService,
    private seoService: SeoService
  ) {
    this.i18n.registerPage('blog', blogMessages);
    this.seoService.applyPageSeo('blog');
    this.seoService.removeStructuredData();
  }

  ngOnInit(): void {
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.blogService.getAllPosts().subscribe(blogs => {
      const posts = blogPostsIn(blogs, this.i18n.locale(), this.i18n.content().blog);
      this.untranslatedCount = blogs.length - posts.length;
      // Newest first; the sort is stable, so posts of the same day keep registry order.
      this.allBlogs = [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());
      this.filteredBlogs = [...this.allBlogs];
    });
  }

  /** Typing in the search box: filters at once, reports the search to GA once the visitor pauses. */
  onSearchInput(): void {
    this.onSearch();
    this.analytics.search(this.searchText, this.resultCount, 'blog');
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
    return new Intl.DateTimeFormat(this.i18n.definition().intl, {
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
    this.analytics.search(tag, this.resultCount, 'blog_tag', true);
    // Scroll to top to show search results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
