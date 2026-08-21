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
      title: 'Zits и Blobs при 3D принтиране – причини и решения | 3D Печат България',
      description: 'Научете как да разпознаете и отстраните zits, blobs и Z-seam дефекти при 3D печат. Практични съвети за оптимизация на температура, ретракция и flow.',
      keywords: 'zits 3D принтиране, blobs 3D печат, Z-seam, дефекти 3D принтер, ретракция филамент, pressure advance, качество 3D отпечатък',
      url: 'https://3dpechat.bg/blog/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya',
      image: 'https://3dpechat.bg/assets/blogs/images/zits-i-blobs-pri-3d-printirane-prichini-i-resheniya-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-08-21').toISOString(),
      modifiedDate: new Date('2026-08-21').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Zits и Blobs при 3D принтиране – причини и решения",
      "description": "Научете как да разпознаете и отстраните zits, blobs и Z-seam дефекти при 3D печат. Практични съвети за оптимизация на температура, ретракция и flow.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-08-21T00:00:00.000Z",
      "dateModified": "2026-08-21T00:00:00.000Z",
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
      "keywords": "zits 3D принтиране, blobs 3D печат, Z-seam, дефекти 3D принтер, ретракция филамент, pressure advance, качество 3D отпечатък"
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
