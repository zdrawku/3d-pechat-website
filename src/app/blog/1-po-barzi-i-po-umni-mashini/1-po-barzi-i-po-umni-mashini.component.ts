import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-1-po-barzi-i-po-umni-mashini',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './1-po-barzi-i-po-umni-mashini.component.html',
  styleUrls: ['./1-po-barzi-i-po-umni-mashini.component.scss'],
})
export class 1PoBarziIPoUmniMashiniComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'По-бързи и по-умни 3D принтери – бъдещето на производството | 3D Печат България',
      description: 'Открийте как новите 3D принтери стават по-бързи, по-интелигентни и по-подходящи за реално производство. Разберете накъде върви технологията след 2024.',
      keywords: '3D принтиране, 3D принтер, бързи 3D принтери, индустриален 3D печат, производство с 3D печат, технологии за 3D принтиране, умни 3D принтери, бъдеще на 3D печата',
      url: 'https://3dpechat.bg/blog/1-po-barzi-i-po-umni-mashini',
      image: 'https://3dpechat.bg/assets/og-image.png',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-09-21').toISOString(),
      modifiedDate: new Date('2026-09-21').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "По-бързи и по-умни 3D принтери – бъдещето на производството",
      "description": "Открийте как новите 3D принтери стават по-бързи, по-интелигентни и по-подходящи за реално производство. Разберете накъде върви технологията след 2024.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-09-21T00:00:00.000Z",
      "dateModified": "2026-09-21T00:00:00.000Z",
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
        "@id": "https://3dpechat.bg/blog/1-po-barzi-i-po-umni-mashini"
      },
      "keywords": "3D принтиране, 3D принтер, бързи 3D принтери, индустриален 3D печат, производство с 3D печат, технологии за 3D принтиране, умни 3D принтери, бъдеще на 3D печата"
    });
  }

  ngOnInit() {
    this.blogService.getPost('1-po-barzi-i-po-umni-mashini').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
