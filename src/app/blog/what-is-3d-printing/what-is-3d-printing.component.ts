import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { DOCUMENT } from '@angular/common';

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
    private meta: Meta,
    private title: Title,
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.title.setTitle('Какво представлява 3D принтирането? - Пълно ръководство 2026');
    this.meta.addTags([
      { name: 'description', content: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.' },
      { name: 'keywords', content: '3D принтиране, 3D принтер, адитивно производство, FDM, SLA, технология, производство' },
      // Canonical URL
      { rel: 'canonical', href: 'https://3dpechat.bg/blog/what-is-3d-printing' },
      // Open Graph Tags
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: 'Какво представлява 3D принтирането? - Пълно ръководство 2026' },
      { property: 'og:description', content: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.' },
      { property: 'og:url', content: 'https://3dpechat.bg/blog/what-is-3d-printing' },
      { property: 'og:image', content: 'https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg' },
      // Twitter Card Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Какво представлява 3D принтирането? - Пълно ръководство 2026' },
      { name: 'twitter:description', content: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.' },
      { name: 'twitter:image', content: 'https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg' }
    ]);
    this.addStructuredData();
  }

  ngOnInit() {
    this.blogService.getPost("what-is-3d-printing").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  private addStructuredData(): void {
    const blogPost = this.blogService.getPostByRoute('/blog/what-is-3d-printing');
    if (!blogPost) return;

    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blogPost.title,
      "description": blogPost.description,
      "author": {
        "@type": "Organization",
        "name": blogPost.author || "3D Печат България"
      },
      "datePublished": blogPost.date.toISOString(),
      "dateModified": blogPost.date.toISOString(),
      "image": blogPost.imageUrl || "https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg",
      "publisher": {
        "@type": "Organization",
        "name": "3D Печат България",
        "logo": {
          "@type": "ImageObject",
          "url": "http://3dpechat.bg/assets/og-image.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://3dpechat.bg${blogPost.route}`
      },
      "keywords": blogPost.tags?.join(', ') || ''
    });
    this.renderer.appendChild(this.document.head, script);
  }
}
