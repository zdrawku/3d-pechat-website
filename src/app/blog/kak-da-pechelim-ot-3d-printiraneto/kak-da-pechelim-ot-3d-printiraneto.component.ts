import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-kak-da-pechelim-ot-3d-printiraneto',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './kak-da-pechelim-ot-3d-printiraneto.component.html',
  styleUrls: ['./kak-da-pechelim-ot-3d-printiraneto.component.scss'],
})
export class KakDaPechelimOt3dPrintiranetoComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Как да печелим от 3D принтирането – Пълен наръчник | 3D Печат България',
      description: 'Открийте 7-те най-печеливши начина да превърнете 3D принтера си в източник на доход. Практични съвети, реални примери и стратегии за успех в България.',
      keywords: '3D принтиране, как да печелим от 3D принтер, 3D печат бизнес, 3D принтер доход, печалба от 3D принтиране, 3D печат услуги, 3D принтиране България',
      url: 'https://3dpechat.bg/blog/kak-da-pechelim-ot-3d-printiraneto/',
      image: 'https://3dpechat.bg/assets/og-image.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-08').toISOString(),
      modifiedDate: new Date('2026-06-08').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Как да печелим от 3D принтирането – Пълен наръчник",
      "description": "Открийте 7-те най-печеливши начина да превърнете 3D принтера си в източник на доход. Практични съвети, реални примери и стратегии за успех в България.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-08T00:00:00.000Z",
      "dateModified": "2026-06-08T00:00:00.000Z",
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
        "@id": "https://3dpechat.bg/blog/kak-da-pechelim-ot-3d-printiraneto/"
      },
      "keywords": "3D принтиране, как да печелим от 3D принтер, 3D печат бизнес, 3D принтер доход, печалба от 3D принтиране, 3D печат услуги, 3D принтиране България"
    });
  }

  ngOnInit() {
    this.blogService.getPost('kak-da-pechelim-ot-3d-printiraneto').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
