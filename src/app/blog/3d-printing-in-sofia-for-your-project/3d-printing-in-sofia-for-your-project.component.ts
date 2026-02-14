import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

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
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    // SEO Title
    this.seoService.updateSeo({
      title: '3D принтиране в София: Защо да изберете локални услуги - 3D Печат България',
      description: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги за вашия проект.',
      keywords: '3D принтиране София, 3D печат София, 3D принтиране услуги, локални 3D принтиране услуги, архитектурен макет, прототип, експресно 3D принтиране',
      url: 'https://3dpechat.bg/blog/3d-printing-in-sofia-for-your-project',
      image: 'https://3dpechat.bg/assets/real-images/20250517_164324.jpg',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-02-02').toISOString(),
      modifiedDate: new Date('2026-02-02').toISOString()
    });

    // Add structured data for rich snippets
    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "3D принтиране в София: Защо да изберете локални услуги за вашия проект?",
      "description": "3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги спрямо онлайн платформите.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-02-02T00:00:00.000Z",
      "dateModified": "2026-02-02T00:00:00.000Z",
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
        "@id": "https://3dpechat.bg/blog/3d-printing-in-sofia-for-your-project"
      },
      "keywords": "3D принтиране София, 3D печат, локални услуги, експресна доставка, архитектурен макет"
    });
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
}
