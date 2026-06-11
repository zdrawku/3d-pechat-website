import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt.component.html',
  styleUrls: ['./3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt.component.scss'],
})
export class ThreeDPrinterZaNachinaeshtiKakEdnoDetePrevarnaHobiVSemeenProektComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: '3D принтер за начинаещи: детско хоби става семеен проект | 3D Печат България',
      description: 'Вдъхновяваща история как 12-годишно дете откри 3D принтирането и превърна хобито в семеен проект. Практични съвети за начинаещи и избор на първи принтер.',
      keywords: '3D принтер за начинаещи, 3D принтиране за деца, първи 3D принтер, семеен проект 3D печат, как да започна с 3D принтиране, 3D printer Bulgaria, детско хоби технологии',
      url: 'https://3dpechat.bg/blog/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
      image: 'https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-06-11').toISOString(),
      modifiedDate: new Date('2026-06-11').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "3D принтер за начинаещи: детско хоби става семеен проект",
      "description": "Вдъхновяваща история как 12-годишно дете откри 3D принтирането и превърна хобито в семеен проект. Практични съвети за начинаещи и избор на първи принтер.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-06-11T00:00:00.000Z",
      "dateModified": "2026-06-11T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/real-images/main-images/3dprinting-hero.jpg",
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
        "@id": "https://3dpechat.bg/blog/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt"
      },
      "keywords": "3D принтер за начинаещи, 3D принтиране за деца, първи 3D принтер, семеен проект 3D печат, как да започна с 3D принтиране, 3D printer Bulgaria, детско хоби технологии"
    });
  }

  ngOnInit() {
    this.blogService.getPost('3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
