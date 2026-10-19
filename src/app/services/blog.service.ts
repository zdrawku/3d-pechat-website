// blog.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';
import { BLOG_POSTS } from './blog-posts.registry';

/**
 * The blog's post list (blog-posts.registry.ts) for the blog index and the
 * related-content block. Article texts are not here: each post's route loads
 * its text lazily, per language (blog/article/article.routes.ts), so neither
 * of those pages downloads every article.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private blogPosts: BlogPost[] = BLOG_POSTS;

  getAllPosts(): Observable<BlogPost[]> {
    return of(this.blogPosts);
  }

  getPostById(id: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.id === id);
  }

  getPostBySlug(slug: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.slug === slug);
  }

  getPostByRoute(route: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.route === route);
  }
}
