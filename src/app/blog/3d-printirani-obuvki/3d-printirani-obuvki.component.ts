import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-3d-printirani-obuvki',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printirani-obuvki.component.html',
  styleUrls: ['./3d-printirani-obuvki.component.scss'],
})
export class ThreeDPrintiraniObuvkiComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: '3D Принтирани Обувки – Бъдещето на Обувната Индустрия | 3D Печат България',
      description: 'Открийте как 3D принтирането революционизира производството на обувки. Технологии, предимства, приложения и възможности за персонализация в България.',
      keywords: '3D принтирани обувки, 3D печат обувки, 3D принтер за обувки, 3D принтиране България, персонализирани обувки, adidas 3D обувки, nike 3D печат',
      url: 'https://3dpechat.bg/blog/3d-printirani-obuvki',
      image: 'https://3dpechat.bg/assets/blogs/images/3d-printirani-obuvki-cover-3.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-02').toISOString(),
      modifiedDate: new Date('2026-06-02').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "3D Принтирани Обувки – Бъдещето на Обувната Индустрия",
      "description": "Открийте как 3D принтирането революционизира производството на обувки. Технологии, предимства, приложения и възможности за персонализация в България.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-02T00:00:00.000Z",
      "dateModified": "2026-06-02T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/3d-printirani-obuvki-cover-3.png",
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
        "@id": "https://3dpechat.bg/blog/3d-printirani-obuvki"
      },
      "keywords": "3D принтирани обувки, 3D печат обувки, 3D принтер за обувки, 3D принтиране България, персонализирани обувки, adidas 3D обувки, nike 3D печат"
    });
  }

  ngOnInit() {
    this.blogService.getPost('3d-printirani-obuvki').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
