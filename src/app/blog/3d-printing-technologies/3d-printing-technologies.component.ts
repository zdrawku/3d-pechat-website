import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-3d-printing-technologies',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printing-technologies.component.html',
  styleUrls: ['./3d-printing-technologies.component.scss'],
})
export class ThreeDPrintingTechnologiesComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Технологии за 3D принтиране: FDM vs SLA vs SLS — Кое за какво? | 3D Печат България',
      description: 'Разберете разликите между FDM, SLA, SLS и другите 3D принтиране технологии. Кога коя е по-подходяща, какви материали се използват и как да изберете правилно.',
      keywords: '3d принтиране, 3d принтиране технологии, FDM, SLA, SLS, DLP, MSLA, MJF, 3D принтер, адитивно производство',
      url: 'https://3dpechat.bg/blog/3d-printing-technologies/',
      image: 'https://3dpechat.bg/assets/og-image.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-03-04').toISOString(),
      modifiedDate: new Date('2026-03-04').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Технологии за 3D принтиране: FDM vs SLA vs SLS — Кое за какво?",
      "description": "Разберете разликите между FDM, SLA, SLS и другите 3D принтиране технологии. Кога коя е по-подходяща, какви материали се използват и как да изберете правилно.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-03-04T00:00:00.000Z",
      "dateModified": "2026-03-04T00:00:00.000Z",
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
        "@id": "https://3dpechat.bg/blog/3d-printing-technologies/"
      },
      "keywords": "3d принтиране, 3d принтиране технологии, FDM, SLA, SLS, DLP, MSLA, MJF"
    });
  }

  ngOnInit() {
    this.blogService.getPost('3d-printing-technologies').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
