import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { BlogService } from '../../services/blog.service';
import { SeoService, faqPageSchema } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';
import { YoutubeEmbedComponent } from '../../shared/youtube-embed/youtube-embed.component';
import { FEATURED_VIDEO, videoObjectSchema } from '../../shared/youtube-embed/video.util';
import { YOUTUBE_SUBSCRIBE_URL } from '../../../data/site-links';

export const SLUG = '3d-pechat-po-porachka-sofia-video';

/** Visible FAQ at the end of the article, mirrored 1:1 in the FAQPage JSON-LD (the spec keeps them in sync). */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: 'Мога ли да поръчам някой от проектите във видеото?',
    answer: 'Да. Разделителите за книги и монетникът „България“ са в каталога ни с продукти. Останалите проекти изработваме по поръчка – пишете ни какво ви трябва.'
  },
  {
    question: 'Трябва ли ми готов 3D модел?',
    answer: 'Не. Можете да изпратите скица, снимка или описание. Помагаме от идеята до готовия модел.'
  },
  {
    question: 'Колко бързо отговаряте на запитване?',
    answer: 'Обичайно отговаряме до 24 часа – по имейл, Viber или Instagram.'
  }
];

/**
 * Article built around the promo video (Idea 7, phase 3). It gives the video a
 * page of its own that search engines can rank, which the home page section
 * cannot do. The player sits between the intro and the timestamped list: the
 * markdown sanitiser would strip an iframe, so the article is split at the
 * `<!-- video -->` marker and the player lives in the template.
 */
@Component({
  selector: 'app-3d-pechat-po-porachka-sofia-video',
  standalone: true,
  imports: [MarkdownModule, IgxButtonDirective, IgxIconComponent, RouterLink, RelatedContentComponent, YoutubeEmbedComponent],
  templateUrl: './3d-pechat-po-porachka-sofia-video.component.html',
  styleUrls: ['./3d-pechat-po-porachka-sofia-video.component.scss'],
})
export class ThreeDPechatPoPorachkaSofiaVideoComponent implements OnInit {
  /** Markdown before / after the `<!-- video -->` marker; the player sits between. */
  postContent = '';
  postContentAfterVideo = '';

  readonly slug = SLUG;
  readonly video = FEATURED_VIDEO;
  readonly youtubeSubscribeUrl = YOUTUBE_SUBSCRIBE_URL;

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    // Meta + BlogPosting/BreadcrumbList from the registry, plus the video it is
    // built around (so the page can earn a video result) and the visible FAQ.
    const video = videoObjectSchema(this.video);
    this.seoService.applyBlogPostSeo(SLUG, {
      article: { video: { '@id': video['@id'] } },
      graph: [video, faqPageSchema(FAQ)]
    });
  }

  ngOnInit() {
    this.blogService.getPost(SLUG).subscribe(data => {
      // The markdown sanitizer strips <iframe>, so the player lives in the template.
      [this.postContent, this.postContentAfterVideo = ''] = data.split('<!-- video -->');
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
