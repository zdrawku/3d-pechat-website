import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-how-to-make-money-with3d-printing',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './how-to-make-money-with3d-printing.html',
  styleUrls: ['./how-to-make-money-with3d-printing.scss'],
})
export class HowToMakeMoneyWith3dPrinting implements OnInit {
  postContent = '';
  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Как да печелите пари с 3D принтер - Пълен гайд 2026',
      description: 'Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2026.',
      keywords: '3D принтиране, печелене на пари, 3D принтер, продажба на 3D принтирани продукти, лицензиране, CE маркировка',
      url: 'https://3dpechat.bg/blog/how-to-make-money-3d-printing',
      image: 'https://3dpechat.bg/assets/blogs/images/design-is-from-question.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-01-15').toISOString(),
      modifiedDate: new Date('2026-01-15').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Как да печелите пари с 3D принтер - Пълен гайд 2026",
      "description": "Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2026.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-01-15T00:00:00.000Z",
      "dateModified": "2026-01-15T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/design-is-from-question.png",
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
        "@id": "https://3dpechat.bg/blog/how-to-make-money-3d-printing"
      },
      "keywords": "3D принтиране, бизнес, печалба, легалност"
    });
  }

  ngOnInit() {
    // Get the article name from the URL (e.g., 3dpechat.bg/blog/pla-vs-abs)
    this.blogService.getPost("how-to-make-money").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}