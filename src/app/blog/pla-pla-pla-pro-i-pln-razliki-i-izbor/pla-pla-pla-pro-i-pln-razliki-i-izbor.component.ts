import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-pla-pla-pla-pro-i-pln-razliki-i-izbor',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './pla-pla-pla-pro-i-pln-razliki-i-izbor.component.html',
  styleUrls: ['./pla-pla-pla-pro-i-pln-razliki-i-izbor.component.scss'],
})
export class PlaPlaPlaProIPlnRazlikiIIzborComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'PLA, PLA+, PLA Pro и PLN: разлики и избор за 3D печат | 3D Печат България',
      description: 'Научете всичко за различните типове PLA филамент – PLA, PLA+, PLA Pro и PLN. Практично ръководство за избор на правилния материал за вашия 3D принтер.',
      keywords: 'PLA филамент, PLA+, PLA Pro, PLN, 3D принтиране, 3D печат, 3D принтер, филамент за 3D принтер, материали за 3D печат',
      url: 'https://3dpechat.bg/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/',
      image: 'https://3dpechat.bg/assets/og-image.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-04').toISOString(),
      modifiedDate: new Date('2026-06-04').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "PLA, PLA+, PLA Pro и PLN: разлики и избор за 3D печат",
      "description": "Научете всичко за различните типове PLA филамент – PLA, PLA+, PLA Pro и PLN. Практично ръководство за избор на правилния материал за вашия 3D принтер.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-04T00:00:00.000Z",
      "dateModified": "2026-06-04T00:00:00.000Z",
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
        "@id": "https://3dpechat.bg/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/"
      },
      "keywords": "PLA филамент, PLA+, PLA Pro, PLN, 3D принтиране, 3D печат, 3D принтер, филамент за 3D принтер, материали за 3D печат"
    });
  }

  ngOnInit() {
    this.blogService.getPost('pla-pla-pla-pro-i-pln-razliki-i-izbor').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
