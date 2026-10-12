import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-what-is-3d-printing',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './what-is-3d-printing.component.html',
  styleUrls: ['./what-is-3d-printing.component.scss'],
})
export class WhatIs3dPrintingComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('what-is-3d-printing');
  }

  ngOnInit() {
    this.blogService.getPost("what-is-3d-printing").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
