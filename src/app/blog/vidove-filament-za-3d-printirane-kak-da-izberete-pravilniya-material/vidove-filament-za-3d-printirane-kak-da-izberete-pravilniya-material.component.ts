import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material.component.html',
  styleUrls: ['./vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material.component.scss'],
})
export class VidoveFilamentZa3dPrintiraneKakDaIzberetePravilniyaMaterialComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Видове филамент за 3D принтиране - пълно ръководство 2024 | 3D Печат България',
      description: 'Научете как да изберете правилния филамент за вашия 3D принтер. Сравнение на PLA, PETG, ABS, TPU, Nylon и други материали с практични съвети за печат.',
      keywords: 'филамент за 3D принтиране, PLA филамент, PETG филамент, ABS филамент, TPU филамент, материали за 3D принтер, как да изберем филамент, 3D печат материали',
      url: 'https://3dpechat.bg/blog/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material',
      image: 'https://3dpechat.bg/assets/blogs/images/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-08-11').toISOString(),
      modifiedDate: new Date('2026-08-11').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Видове филамент за 3D принтиране - пълно ръководство 2024",
      "description": "Научете как да изберете правилния филамент за вашия 3D принтер. Сравнение на PLA, PETG, ABS, TPU, Nylon и други материали с практични съвети за печат.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-08-11T00:00:00.000Z",
      "dateModified": "2026-08-11T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material"
      },
      "keywords": "филамент за 3D принтиране, PLA филамент, PETG филамент, ABS филамент, TPU филамент, материали за 3D принтер, как да изберем филамент, 3D печат материали"
    });
  }

  ngOnInit() {
    this.blogService.getPost('vidove-filament-za-3d-printirane-kak-da-izberete-pravilniya-material').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
