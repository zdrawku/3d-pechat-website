import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-standstrap-3d-printiran-stoper-za-snoubord',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './standstrap-3d-printiran-stoper-za-snoubord.component.html',
  styleUrls: ['./standstrap-3d-printiran-stoper-za-snoubord.component.scss'],
})
export class Standstrap3dPrintiranStoperZaSnoubordComponent implements OnInit {
  /** Markdown before / after the `<!-- video -->` marker; the video sits between. */
  postContent = '';
  postContentAfterVideo = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'StandStrap: как направих 3D принтиран стопер за сноуборд | 3D Печат България',
      description: 'Как проектирах и отпечатах StandStrap — щипка за ръба на сноуборда, която държи дъската на място, докато закопчаваш автоматите прав. Дизайн, настройки за печат и видео.',
      keywords: 'стопер за сноуборд, сноуборд аксесоар, 3D принтиран сноуборд аксесоар, StandStrap, закопчаване на автомати, Bambu Studio, PLA, 3D печат България',
      url: 'https://3dpechat.bg/blog/standstrap-3d-printiran-stoper-za-snoubord/',
      image: 'https://3dpechat.bg/assets/blogs/images/standstrap-3d-printiran-stoper-za-snoubord-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-10-12').toISOString(),
      modifiedDate: new Date('2026-10-12').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "StandStrap: как направих 3D принтиран стопер за сноуборд",
      "description": "Как проектирах и отпечатах StandStrap — щипка за ръба на сноуборда, която държи дъската на място, докато закопчаваш автоматите прав. Дизайн, настройки за печат и видео.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-10-12T00:00:00.000Z",
      "dateModified": "2026-10-12T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/standstrap-3d-printiran-stoper-za-snoubord-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/standstrap-3d-printiran-stoper-za-snoubord/"
      },
      "keywords": "стопер за сноуборд, сноуборд аксесоар, 3D принтиран сноуборд аксесоар, StandStrap, закопчаване на автомати, Bambu Studio, PLA, 3D печат България"
    });
  }

  ngOnInit() {
    this.blogService.getPost('standstrap-3d-printiran-stoper-za-snoubord').subscribe(data => {
      // The markdown sanitizer strips <video>, so the clip lives in the template.
      [this.postContent, this.postContentAfterVideo = ''] = data.split('<!-- video -->');
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
