import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-how-to-make-money-with3d-printing',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './how-to-make-money-with3d-printing.html',
  styleUrls: ['./how-to-make-money-with3d-printing.scss'],
})
export class HowToMakeMoneyWith3dPrinting implements OnInit{
  postContent = '';
  constructor(
    private meta: Meta,
    private title: Title,
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.title.setTitle('Как да печелите пари с 3D принтер - Пълен гайд 2026');
    this.meta.addTags([
      { name: 'description', content: 'Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2026.' },
      { name: 'keywords', content: '3D принтиране, печелене на пари, 3D принтер, продажба на 3D принтирани продукти, лицензиране, CE маркировка' },
      // Canonical URL
      { rel: 'canonical', href: 'https://3dpechat.bg/blog/how-to-make-money-3d-printing' },
      // Open Graph Tags
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: 'Как да печелите пари с 3D принтер - Пълен гайд 2026' },
      { property: 'og:description', content: 'Научете как да печелите пари с вашия 3D принтер, як да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2026.' },
      { property: 'og:url', content: 'https://3dpechat.bg/blog/how-to-make-money-3d-printing' },
      { property: 'og:image', content: 'https://3dpechat.bg/assets/blogs/images/design-is-from-question.png' },
      // Twitter Card Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Как да печелите пари с 3D принтер - Пълен гайд 2026' },
      { name: 'twitter:description', content: 'Научете как да печелите пари с вашия 3D принтер, як да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2026.' },
      { name: 'twitter:image', content: 'https://3dpechat.bg/assets/blogs/images/design-is-from-question.png' }
    ]);
    this.addStructuredData();
  }

  ngOnInit() {
    // Get the article name from the URL (e.g., 3dpechat.bg/blog/pla-vs-abs)
    this.blogService.getPost("how-to-make-money").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  private addStructuredData(): void {
    const blogPost = this.blogService.getPostByRoute('/blog/how-to-make-money-3d-printing');
    if (!blogPost) return;

    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blogPost.title,
      "description": blogPost.description,
      "author": {
        "@type": "Organization",
        "name": blogPost.author || "3D Печат България"
      },
      "datePublished": blogPost.date.toISOString(),
      "dateModified": blogPost.date.toISOString(),
      "image": blogPost.imageUrl || "https://3dpechat.bg/assets/blogs/images/design-is-from-question.png",
      "publisher": {
        "@type": "Organization",
        "name": "3D Печат България",
        "logo": {
          "@type": "ImageObject",
          "url": "http://3dpechat.bg/assets/og-image.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://3dpechat.bg${blogPost.route}`
      },
      "keywords": blogPost.tags?.join(', ') || ''
    });
    this.renderer.appendChild(this.document.head, script);
  }
}