// blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  // Central registry of all blog posts
  private blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Как да печелите пари с 3D принтер - Пълен гайд 2026',
      description: 'Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2025.',
      slug: 'how-to-make-money',
      route: '/blog/how-to-make-money-3d-printing',
      date: new Date('2026-01-15'),
      tags: ['3D принтиране', 'бизнес', 'печалба', 'легалност'],
      author: '3D Печат България'    },
    {
      id: '2',
      title: 'Какво представлява 3D принтирането? - Пълно ръководство 2026',
      description: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.',
      slug: 'what-is-3d-printing',
      route: '/blog/what-is-3d-printing',
      date: new Date('2026-02-08'),
      tags: ['3D принтиране', '3D принтер', 'технология', 'адитивно производство'],
      author: '3D Печат България'    }
    // Add more blog posts here as you create them
  ];

  constructor(private http: HttpClient) {}

  getPost(slug: string): Observable<string> {
    // Fetches the text file from your assets folder
    return this.http.get(`/assets/blogs/${slug}.md`, { responseType: 'text' });
  }

  getAllPosts(): Observable<BlogPost[]> {
    return of(this.blogPosts);
  }

  getPostById(id: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.id === id);
  }

  getPostByRoute(route: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.route === route);
  }
}