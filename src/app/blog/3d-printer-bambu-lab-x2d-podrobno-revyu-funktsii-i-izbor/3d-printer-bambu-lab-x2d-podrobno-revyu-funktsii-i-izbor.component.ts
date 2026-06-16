import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor.component.html',
  styleUrls: ['./3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor.component.scss'],
})
export class ThreeDPrinterBambuLabX2dPodrobnoRevyuFunktsiiIIzborComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: '3D принтер Bambu Lab X2D: Ревю, функции и избор | 3D Печат България',
      description: 'Подробно ревю на 3D принтера Bambu Lab X2D. Характеристики, предимства, недостатъци и съвети за избор. Всичко за високоскоростното 3D принтиране.',
      keywords: 'Bambu Lab X2D, 3D принтер, 3D принтиране, 3D печат, CoreXY принтер, високоскоростно 3D принтиране, Bambu Lab България, 3D принтер ревю',
      url: 'https://3dpechat.bg/blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
      image: 'https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-15').toISOString(),
      modifiedDate: new Date('2026-06-15').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "3D принтер Bambu Lab X2D: Ревю, функции и избор",
      "description": "Подробно ревю на 3D принтера Bambu Lab X2D. Характеристики, предимства, недостатъци и съвети за избор. Всичко за високоскоростното 3D принтиране.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-15T00:00:00.000Z",
      "dateModified": "2026-06-15T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg",
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
        "@id": "https://3dpechat.bg/blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor"
      },
      "keywords": "Bambu Lab X2D, 3D принтер, 3D принтиране, 3D печат, CoreXY принтер, високоскоростно 3D принтиране, Bambu Lab България, 3D принтер ревю"
    });
  }

  ngOnInit() {
    this.blogService.getPost('3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
