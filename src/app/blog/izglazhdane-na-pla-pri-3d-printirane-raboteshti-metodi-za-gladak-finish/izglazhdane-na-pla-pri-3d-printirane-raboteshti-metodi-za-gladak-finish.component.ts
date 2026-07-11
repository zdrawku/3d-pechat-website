import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component.html',
  styleUrls: ['./izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component.scss'],
})
export class IzglazhdaneNaPlaPri3dPrintiraneRaboteshtiMetodiZaGladakFinishComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'Изглаждане на PLA при 3D принтиране: 7 работещи метода | 3D Печат България',
      description: 'Научете как да постигнете перфектно гладък финиш на PLA отпечатъци. Практично ръководство с работещи методи за изглаждане при 3D принтиране в домашни условия.',
      keywords: 'изглаждане на PLA, 3D принтиране, 3D печат, постобработка 3D принт, гладък финиш PLA, PLA filament, 3D принтер, шлайфане PLA',
      url: 'https://3dpechat.bg/blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish/',
      image: 'https://3dpechat.bg/assets/blogs/images/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-02').toISOString(),
      modifiedDate: new Date('2026-06-02').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "Изглаждане на PLA при 3D принтиране: 7 работещи метода",
      "description": "Научете как да постигнете перфектно гладък финиш на PLA отпечатъци. Практично ръководство с работещи методи за изглаждане при 3D принтиране в домашни условия.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-02T00:00:00.000Z",
      "dateModified": "2026-06-02T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish/"
      },
      "keywords": "изглаждане на PLA, 3D принтиране, 3D печат, постобработка 3D принт, гладък финиш PLA, PLA filament, 3D принтер, шлайфане PLA"
    });
  }

  ngOnInit() {
    this.blogService.getPost('izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
