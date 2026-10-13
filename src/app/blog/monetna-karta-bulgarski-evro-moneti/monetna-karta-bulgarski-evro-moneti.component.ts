import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

/**
 * MakerWorld model link, substituted for `{{MAKERWORLD_URL}}` in the article.
 * If it is ever emptied, the whole `<!-- makerworld -->` section is dropped, so
 * a literal `{{MAKERWORLD_URL}}` can never ship as a broken link.
 */
export const MAKERWORLD_URL = 'https://makerworld.com/en/models/3435823-coin-card-holder-bulgaria-euro#profileId-3917631';

/** Visible FAQ in the article, mirrored 1:1 in the FAQPage JSON-LD (spec keeps them in sync). */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: 'Кои монети побира монетната карта?',
    answer: 'Комплектът от осемте български евромонети: 1, 2, 5, 10, 20 и 50 цента, 1 € и 2 €. Всяка монета има собствено гнездо.'
  },
  {
    question: 'От какъв материал е изработена?',
    answer: 'От PLA — стабилен пластмасов материал за 3D печат.'
  },
  {
    question: 'Монетите изпадат ли от гнездата?',
    answer: 'Не. Гнездата са оразмерени точно според диаметъра на всяка монета и я държат стабилно, без лепило.'
  },
  {
    question: 'Какви форми и дизайни има?',
    answer: 'Правоъгълна карта с българско знаме, карта с формата на България с цветни линии, България в цветовете на Европейския съюз, както и правоъгълни карти с премиум кейс.'
  },
  {
    question: 'Мога ли да поръчам персонализирана карта?',
    answer: 'Да. При Вариант 4 избирате формата, дизайна, снимката или текста и броя на слотовете. Пишете ни през страницата за контакти.'
  },
  {
    question: 'Мога ли да отпечатам картата сам?',
    answer: 'Да, ако имате 3D принтер. Моделът е публикуван в MakerWorld с готови print profiles за отделните варианти, а ако предпочитате готова карта, разгледайте каталога ни.'
  }
];

const TITLE = 'Монетна карта за български евромонети | 3D Печат България';
const HEADLINE = 'Монетна карта за българските евромонети – пълен комплект от 1 цент до 2 евро';
const DESCRIPTION = 'Монетна карта за пълен комплект български евромонети – от 1 цент до 2 евро. 5 варианта от PLA, идеални за подарък и колекция.';
const KEYWORDS = 'монетна карта, български евромонети, комплект евромонети, карта за монети, подарък за колекционер, 3D принтирана монетна карта, 3D печат България';
const URL = 'https://3dpechat.bg/blog/monetna-karta-bulgarski-evro-moneti/';
const IMAGE = 'https://3dpechat.bg/assets/blogs/images/monetna-karta-bulgarski-evro-moneti-cover.webp';

@Component({
  selector: 'app-monetna-karta-bulgarski-evro-moneti',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RouterLink, RelatedContentComponent],
  templateUrl: './monetna-karta-bulgarski-evro-moneti.component.html',
  styleUrls: ['./monetna-karta-bulgarski-evro-moneti.component.scss'],
})
export class MonetnaKartaBulgarskiEvroMonetiComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: TITLE,
      description: DESCRIPTION,
      keywords: KEYWORDS,
      url: URL,
      image: IMAGE,
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('2026-10-12').toISOString(),
      modifiedDate: new Date('2026-10-12').toISOString()
    });

    // One JSON-LD block carrying both types the article needs.
    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "headline": HEADLINE,
          "description": DESCRIPTION,
          "author": { "@type": "Organization", "name": "3D Печат България" },
          "datePublished": "2026-10-12T00:00:00.000Z",
          "dateModified": "2026-10-12T00:00:00.000Z",
          "image": IMAGE,
          "publisher": {
            "@type": "Organization",
            "name": "3D Печат България",
            "logo": { "@type": "ImageObject", "url": "https://3dpechat.bg/assets/og-image.png" }
          },
          "mainEntityOfPage": { "@type": "WebPage", "@id": URL },
          "keywords": KEYWORDS
        },
        {
          "@type": "FAQPage",
          "mainEntity": FAQ.map(({ question, answer }) => ({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": { "@type": "Answer", "text": answer }
          }))
        }
      ]
    });
  }

  ngOnInit() {
    this.blogService.getPost('monetna-karta-bulgarski-evro-moneti').subscribe(data => {
      this.postContent = data.replace(
        /<!-- makerworld -->([\s\S]*?)<!-- \/makerworld -->/,
        (_, section: string) => MAKERWORLD_URL ? section.replaceAll('{{MAKERWORLD_URL}}', MAKERWORLD_URL) : ''
      );
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
