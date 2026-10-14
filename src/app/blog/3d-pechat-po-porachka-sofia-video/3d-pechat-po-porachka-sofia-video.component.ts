import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { BlogService } from '../../services/blog.service';
import { SeoService } from '../../services/seo.service';
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

const TITLE = 'Видео: 3D печат по поръчка в София | 3D Печат България';
const HEADLINE = 'Вижте как работим: 3D печат по поръчка в София (видео)';
const DESCRIPTION = 'Вижте в 60 секунди наши 3D отпечатани проекти: разделители за книги, монетник „България“ и функционални части. И как протича поръчката от идея до детайл.';
const KEYWORDS = '3D печат по поръчка, 3D печат София, 3D принтиране видео, 3D отпечатани проекти, разделители за книги, монетник България, прототипи, 3D Печат България';
const URL = `https://3dpechat.bg/blog/${SLUG}/`;
const IMAGE = `https://3dpechat.bg/assets/blogs/images/${SLUG}-cover.webp`;
const PUBLISHED = '2026-10-14T00:00:00.000Z';

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
    this.seoService.updateSeo({
      title: TITLE,
      description: DESCRIPTION,
      keywords: KEYWORDS,
      url: URL,
      image: IMAGE,
      type: 'article',
      author: '3D Печат България',
      publishedDate: PUBLISHED,
      modifiedDate: PUBLISHED
    });

    // One JSON-LD block: the article, the video it is built around (so the
    // page can earn a video result), and the visible FAQ.
    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BlogPosting',
          headline: HEADLINE,
          description: DESCRIPTION,
          author: { '@type': 'Organization', name: '3D Печат България' },
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          image: IMAGE,
          publisher: {
            '@type': 'Organization',
            name: '3D Печат България',
            logo: { '@type': 'ImageObject', url: 'https://3dpechat.bg/assets/og-image.png' }
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
          video: { '@id': videoObjectSchema(this.video)['@id'] },
          keywords: KEYWORDS
        },
        videoObjectSchema(this.video),
        {
          '@type': 'FAQPage',
          mainEntity: FAQ.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
          }))
        }
      ]
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
