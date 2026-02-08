import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-3d-printing-in-sofia-for-your-project',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printing-in-sofia-for-your-project.component.html',
  styleUrls: ['./3d-printing-in-sofia-for-your-project.component.scss'],
})
export class ThreeDPrintingInSofiaForYourProjectComponent implements OnInit {
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
    // SEO Title
    this.title.setTitle('3D принтиране в София: Защо да изберете локални услуги - 3D Печат България');
    
    // Meta Tags for SEO and Social Sharing
    this.meta.addTags([
      // Basic SEO
      { name: 'description', content: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги за вашия проект.' },
      { name: 'keywords', content: '3D принтиране София, 3D печат София, 3D принтиране услуги, локални 3D принтиране услуги, архитектурен макет, прототип, експресно 3D принтиране' },
      
      // Canonical URL
      { rel: 'canonical', href: 'https://3dpechat.bg/blog/3d-printing-in-sofia-for-your-project' },
      
      // Open Graph Tags (Facebook, LinkedIn)
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: '3D принтиране в София: Защо да изберете локални услуги за вашия проект?' },
      { property: 'og:description', content: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги за вашия проект.' },
      { property: 'og:url', content: 'https://3dpechat.bg/blog/3d-printing-in-sofia-for-your-project' },
      { property: 'og:image', content: 'https://3dpechat.bg/assets/real-images/20250517_164324.jpg' },
      
      // Twitter Card Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: '3D принтиране в София: Защо да изберете локални услуги' },
      { name: 'twitter:description', content: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги.' },
      { name: 'twitter:image', content: 'https://3dpechat.bg/assets/real-images/20250517_164324.jpg' }
    ]);
    
    // Add structured data for rich snippets
    this.addStructuredData();
  }

  ngOnInit() {
    // Load markdown content
    this.blogService.getPost("3d-printing-in-sofia-for-your-project").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  private addStructuredData(): void {
    const blogPost = this.blogService.getPostByRoute('/blog/3d-printing-in-sofia-for-your-project');
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
      "image": "https://3dpechat.bg/assets/real-images/20250517_164324.jpg",
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
        "@id": `https://3dpechat.bg${blogPost.route}`
      },
      "keywords": blogPost.tags?.join(', ') || ''
    });
    this.renderer.appendChild(this.document.head, script);
  }
}
