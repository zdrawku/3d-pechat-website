import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-barzi-i-umni-3d-printeri',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './barzi-i-umni-3d-printeri.component.html',
  styleUrls: ['./barzi-i-umni-3d-printeri.component.scss'],
})
export class BarziIUmni3dPrinteriComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: 'По-бързи и по-умни 3D принтери: опитът ни с Bambu Lab A1 Combo | 3D Печат България',
      description: 'Как 3D принтерите станаха бързи, тихи и умни – тенденциите и реалният ни опит с Bambu Lab A1 Combo у дома. Предимства, ограничения и съвети.',
      keywords: 'Bambu Lab A1 Combo, A1 Combo ревю, бързи 3D принтери, умни 3D принтери, AMS lite, многоцветен 3D печат, 3D принтер за дома, 3D принтиране, 3D печат',
      url: 'https://3dpechat.bg/blog/barzi-i-umni-3d-printeri/',
      image: 'https://3dpechat.bg/assets/blogs/images/barzi-i-umni-3d-printeri-cover.webp',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-10-11').toISOString(),
      modifiedDate: new Date('2026-10-11').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "По-бързи и по-умни 3D принтери: опитът ни с Bambu Lab A1 Combo",
      "description": "Как 3D принтерите станаха бързи, тихи и умни – тенденциите и реалният ни опит с Bambu Lab A1 Combo у дома. Предимства, ограничения и съвети.",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "2026-10-11T00:00:00.000Z",
      "dateModified": "2026-10-11T00:00:00.000Z",
      "image": "https://3dpechat.bg/assets/blogs/images/barzi-i-umni-3d-printeri-cover.webp",
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
        "@id": "https://3dpechat.bg/blog/barzi-i-umni-3d-printeri/"
      },
      "keywords": "Bambu Lab A1 Combo, A1 Combo ревю, бързи 3D принтери, умни 3D принтери, AMS lite, многоцветен 3D печат, 3D принтер за дома, 3D принтиране, 3D печат"
    });
  }

  ngOnInit() {
    this.blogService.getPost('barzi-i-umni-3d-printeri').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
