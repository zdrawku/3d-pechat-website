import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService, faqPageSchema } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

const SLUG = 'monetna-karta-bulgarski-evro-moneti';

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
    // Meta + BlogPosting/BreadcrumbList from the registry, plus the visible FAQ.
    this.seoService.applyBlogPostSeo(SLUG, { graph: [faqPageSchema(FAQ)] });
  }

  ngOnInit() {
    this.blogService.getPost(SLUG).subscribe(data => {
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
