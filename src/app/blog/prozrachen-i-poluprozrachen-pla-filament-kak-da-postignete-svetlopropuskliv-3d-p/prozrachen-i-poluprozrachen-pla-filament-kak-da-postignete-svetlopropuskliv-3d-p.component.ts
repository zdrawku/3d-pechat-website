import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p.component.html',
  styleUrls: ['./prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p.component.scss'],
})
export class ProzrachenIPoluprozrachenPlaFilamentKakDaPostigneteSvetlopropuskliv3dPComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Прозрачен PLA филамент: как да постигнете светлопропусклив 3D печат | 3D Печат България',
      description: 'Практическо ръководство за 3D принтиране с прозрачен и полупрозрачен PLA филамент. Настройки, техники и сравнение с PETG и ABS за оптимални резултати.',
      keywords: 'прозрачен PLA, полупрозрачен филамент, 3D принтиране, светлопропусклив 3D печат, transparent PLA, PETG филамент, настройки за прозрачен PLA, 3D принтер',
      url: 'https://3dpechat.bg/blog/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p',
      image: 'https://3dpechat.bg/assets/blogs/images/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p-cover.jpg',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-08-03').toISOString(),
      modifiedDate: new Date('2026-08-03').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Прозрачен PLA филамент: как да постигнете светлопропусклив 3D печат",
      "description": "Практическо ръководство за 3D принтиране с прозрачен и полупрозрачен PLA филамент. Настройки, техники и сравнение с PETG и ABS за оптимални резултати.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-08-03T00:00:00.000Z",
      "dateModified": "2026-08-03T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p-cover.jpg",
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
        "@id": "https://3dpechat.bg/blog/prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p"
      },
      "keywords": "прозрачен PLA, полупрозрачен филамент, 3D принтиране, светлопропусклив 3D печат, transparent PLA, PETG филамент, настройки за прозрачен PLA, 3D принтер"
    });
  }

  ngOnInit() {
    this.blogService.getPost('prozrachen-i-poluprozrachen-pla-filament-kak-da-postignete-svetlopropuskliv-3d-p').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
