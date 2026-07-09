import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-what-is-3d-printing',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
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
    this.seoService.updateSeo({
      title: 'Какво представлява 3D принтирането? - Пълно ръководство 2026',
      description: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.',
      keywords: '3D принтиране, 3D принтер, адитивно производство, FDM, SLA, технология, производство',
      url: 'https://3dpechat.bg/blog/what-is-3d-printing',
      image: 'https://3dpechat.bg/assets/og-image.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-02-08').toISOString(),
      modifiedDate: new Date('2026-02-08').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Какво представлява 3D принтирането? - Пълно ръководство 2026",
      "description": "Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-02-08T00:00:00.000Z",
      "dateModified": "2026-02-08T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/og-image.png",
      "publisher": {
        "@type": "Organization",
        "name": "3D Печат България",
        "logo": {
          "@type": "ImageObject",
          "url": "https://3dpechat.bg/assets/og-image.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://3dpechat.bg/blog/what-is-3d-printing"
      },
      "keywords": "3D принтиране, 3D принтер, технология, адитивно производство"
    });
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
