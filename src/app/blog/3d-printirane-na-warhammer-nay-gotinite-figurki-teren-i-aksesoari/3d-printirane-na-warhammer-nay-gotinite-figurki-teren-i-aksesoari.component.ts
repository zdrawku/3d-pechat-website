import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component.html',
  styleUrls: ['./3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component.scss'],
})
export class ThreeDPrintiraneNaWarhammerNayGotiniteFigurkiTerenIAksesoariComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: '3D принтиране на Warhammer фигурки | 3D Печат България',
      description: 'Открийте как да принтирате Warhammer фигурки, терен и аксесоари с 3D принтер. Практичен гид с препоръки за модели, материали и настройки за печат.',
      keywords: '3D принтиране, Warhammer, 3D принтер, фигурки Warhammer, 3D печат, resin принтер, терен за Warhammer, миниатюри, tabletop gaming, 3dpechat',
      url: 'https://3dpechat.bg/blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari/',
      image: 'https://3dpechat.bg/assets/blogs/images/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-02').toISOString(),
      modifiedDate: new Date('2026-06-02').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "3D принтиране на Warhammer фигурки",
      "description": "Открийте как да принтирате Warhammer фигурки, терен и аксесоари с 3D принтер. Практичен гид с препоръки за модели, материали и настройки за печат.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-02T00:00:00.000Z",
      "dateModified": "2026-06-02T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari/"
      },
      "keywords": "3D принтиране, Warhammer, 3D принтер, фигурки Warhammer, 3D печат, resin принтер, терен за Warhammer, миниатюри, tabletop gaming, 3dpechat"
    });
  }

  ngOnInit() {
    this.blogService.getPost('3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
