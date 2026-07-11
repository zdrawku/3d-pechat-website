import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-infill-pri-3d-pechat-platnost-zdravina-i-filament',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './infill-pri-3d-pechat-platnost-zdravina-i-filament.component.html',
  styleUrls: ['./infill-pri-3d-pechat-platnost-zdravina-i-filament.component.scss'],
})
export class InfillPri3dPechatPlatnostZdravinaIFilamentComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Infill при 3D печат: плътност, здравина и филамент | 3D Печат България',
      description: 'Научете как infill плътността влияе върху здравината, теглото и разхода на филамент при 3D принтиране. Практически съвети за избор на правилните настройки.',
      keywords: 'infill 3D печат, плътност 3D принтиране, здравина 3D печат, филамент разход, 3D принтер настройки, infill patterns, 3D печат България',
      url: 'https://3dpechat.bg/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament/',
      image: 'https://3dpechat.bg/assets/blogs/images/infill-pri-3d-pechat-platnost-zdravina-i-filament-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-07-06').toISOString(),
      modifiedDate: new Date('2026-07-06').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Infill при 3D печат: плътност, здравина и филамент",
      "description": "Научете как infill плътността влияе върху здравината, теглото и разхода на филамент при 3D принтиране. Практически съвети за избор на правилните настройки.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-07-06T00:00:00.000Z",
      "dateModified": "2026-07-06T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/infill-pri-3d-pechat-platnost-zdravina-i-filament-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament/"
      },
      "keywords": "infill 3D печат, плътност 3D принтиране, здравина 3D печат, филамент разход, 3D принтер настройки, infill patterns, 3D печат България"
    });
  }

  ngOnInit() {
    this.blogService.getPost('infill-pri-3d-pechat-platnost-zdravina-i-filament').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
