// blog.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';
import { BLOG_CONTENT } from './blog-content.generated';
import { BLOG_POSTS } from './blog-posts.registry';

@Injectable({ providedIn: 'root' })
export class BlogService {
  // Central registry of all blog posts lives in blog-posts.registry.ts
  private blogPosts: BlogPost[] = BLOG_POSTS;


  getPost(slug: string): Observable<string> {
    // Content is bundled at build time so it's available during prerendering.
    // A missing slug throws so the error fails the prerender build instead of
    // shipping a silently empty article page.
    const content = BLOG_CONTENT[slug];
    if (content === undefined) {
      throw new Error(`No blog content for slug "${slug}". Check the filename in src/assets/blogs and rerun "npm run generate-blog-content".`);
    }
    return of(content);
  }

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