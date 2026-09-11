import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-zits-i-blobs-pri-3d-printirane-prichini-i-resheniya',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './zits-i-blobs-pri-3d-printirane-prichini-i-resheniya.component.html',
  styleUrls: ['./zits-i-blobs-pri-3d-printirane-prichini-i-resheniya.component.scss'],
})
export class ZitsIBlobsPri3dPrintiranePrichiniIResheniyaComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Zits и blobs при 3D принтиране: причини и решения | 3D Печат България',
      description: 'Научете как да разпознаете и отстраните zits, blobs и Z-seam дефекти при 3D печат. Практични съвети за филамент, температура, ретракция и настройки.',
      keywords: 'zits 3D принтиране, blobs 3D печат, Z-seam, дефекти 3D принтер, ретракция, flow настройки, качество 3D печат, Linear Advance',
      url: 'https://3dpechat.bg/blog/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya',
      image: 'https://3dpechat.bg/assets/blogs/images/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-09-11').toISOString(),
      modifiedDate: new Date('2026-09-11').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Zits и blobs при 3D принтиране: причини и решения",
      "description": "Научете как да разпознаете и отстраните zits, blobs и Z-seam дефекти при 3D печат. Практични съвети за филамент, температура, ретракция и настройки.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-09-11T00:00:00.000Z",
      "dateModified": "2026-09-11T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya"
      },
      "keywords": "zits 3D принтиране, blobs 3D печат, Z-seam, дефекти 3D принтер, ретракция, flow настройки, качество 3D печат, Linear Advance"
    });
  }

  ngOnInit() {
    this.blogService.getPost('zits-i-blobs-pri-3d-printirane-prichini-i-resheniya').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
