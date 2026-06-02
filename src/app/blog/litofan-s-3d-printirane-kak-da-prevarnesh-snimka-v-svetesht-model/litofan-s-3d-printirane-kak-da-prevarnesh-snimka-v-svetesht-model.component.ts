import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model.component.html',
  styleUrls: ['./litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model.component.scss'],
})
export class LitofanS3dPrintiraneKakDaPrevarneshSnimkaVSveteshtModelComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Литофан с 3D принтиране: превърни снимка в светещ модел | 3D Печат България',
      description: 'Научи как да създадеш уникален литофан с 3D принтер. Пълно ръководство за превръщане на любима снимка в светещ 3D модел – стъпка по стъпка инструкции.',
      keywords: 'литофан, 3D принтиране, 3D принтер, литофан 3D печат, 3D модел от снимка, светещ 3D модел, lithophane, 3D печат България',
      url: 'https://3dpechat.bg/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
      image: 'https://3dpechat.bg/assets/blogs/images/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model-cover.jpg',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-02').toISOString(),
      modifiedDate: new Date('2026-06-02').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Литофан с 3D принтиране: превърни снимка в светещ модел",
      "description": "Научи как да създадеш уникален литофан с 3D принтер. Пълно ръководство за превръщане на любима снимка в светещ 3D модел – стъпка по стъпка инструкции.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-02T00:00:00.000Z",
      "dateModified": "2026-06-02T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model-cover.jpg",
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
        "@id": "https://3dpechat.bg/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model"
      },
      "keywords": "литофан, 3D принтиране, 3D принтер, литофан 3D печат, 3D модел от снимка, светещ 3D модел, lithophane, 3D печат България"
    });
  }

  ngOnInit() {
    this.blogService.getPost('litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
