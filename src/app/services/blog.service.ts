// blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private http: HttpClient) {}

  getPost(slug: string): Observable<string> {
    // Fetches the text file from your assets folder
    return this.http.get(`/assets/blogs/${slug}.md`, { responseType: 'text' });
  }
}