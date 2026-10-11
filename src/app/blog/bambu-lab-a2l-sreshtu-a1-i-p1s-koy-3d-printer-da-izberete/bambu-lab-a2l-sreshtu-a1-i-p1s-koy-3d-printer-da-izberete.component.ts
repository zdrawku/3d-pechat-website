import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete.component.html',
  styleUrls: ['./bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete.component.scss'],
})
export class BambuLabA2lSreshtuA1IP1sKoy3dPrinterDaIzbereteComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Bambu Lab A2L срещу A1 и P1S: кой 3D принтер да изберете? | 3D Печат България',
      description: 'Сравнение на Bambu Lab A2L с A1 и P1S моделите. Разберете кой 3D принтер е най-подходящ за вашите нужди – характеристики, цени и препоръки.',
      keywords: 'Bambu Lab A2L, Bambu Lab A1, Bambu Lab P1S, 3D принтер, 3D принтиране, сравнение 3D принтери, FDM принтер, 3D печат',
      url: 'https://3dpechat.bg/blog/bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete',
      image: 'https://3dpechat.bg/assets/blogs/images/bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-10-11').toISOString(),
      modifiedDate: new Date('2026-10-11').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Bambu Lab A2L срещу A1 и P1S: кой 3D принтер да изберете?",
      "description": "Сравнение на Bambu Lab A2L с A1 и P1S моделите. Разберете кой 3D принтер е най-подходящ за вашите нужди – характеристики, цени и препоръки.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-10-11T00:00:00.000Z",
      "dateModified": "2026-10-11T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete"
      },
      "keywords": "Bambu Lab A2L, Bambu Lab A1, Bambu Lab P1S, 3D принтер, 3D принтиране, сравнение 3D принтери, FDM принтер, 3D печат"
    });
  }

  ngOnInit() {
    this.blogService.getPost('bambu-lab-a2l-sreshtu-a1-i-p1s-koy-3d-printer-da-izberete').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
