import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { YOUTUBE_SUBSCRIBE_URL } from '../../../data/site-links';
import { I18nService } from '../../i18n/i18n.service';
import { localizeVideo, translateBlogPost } from '../../i18n/localized-content';
import { LocalizePathPipe, TranslatePipe } from '../../i18n/translate.pipe';
import { BLOG_POSTS } from '../../services/blog-posts.registry';
import { SeoService, faqPageSchema } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';
import { YoutubeEmbedComponent } from '../../shared/youtube-embed/youtube-embed.component';
import { FEATURED_VIDEO, videoObjectSchema } from '../../shared/youtube-embed/video.util';
import { ArticleToolbarComponent } from '../shared/article-toolbar/article-toolbar.component';
import { faqFromMarkdown, fillMakerWorldSection, splitAtVideo } from '../shared/article-markdown';
import { ARTICLE_EXTRAS, ArticleExtras } from './article-extras';
import type { ArticleData } from './article.routes';

/**
 * Every blog post, in every language (/blog/<slug>/, /en/blog/<slug>/): one
 * component, fed by its route (article.routes.ts) with the post's Bulgarian
 * slug and its text. Everything else follows from the slug — metadata from
 * blog-posts.registry.ts (or the translation's copy in
 * src/i18n/<lang>/content/blog.json), extras from {@link ARTICLE_EXTRAS}. A
 * `<!-- faq -->` section in the text becomes FAQPage schema word for word, so
 * the two can't drift apart.
 *
 * A post without a text throws, so the prerender fails instead of shipping an
 * empty article.
 */
@Component({
  selector: 'app-blog-article',
  imports: [
    MarkdownModule,
    RouterLink,
    IgxButtonDirective,
    IgxIconComponent,
    ArticleToolbarComponent,
    RelatedContentComponent,
    YoutubeEmbedComponent,
    TranslatePipe,
    LocalizePathPipe
  ],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class BlogArticleComponent {
  private readonly i18n = inject(I18nService);
  private readonly seo = inject(SeoService);

  protected readonly video = localizeVideo(FEATURED_VIDEO, this.i18n.content().videos[FEATURED_VIDEO.slug]);
  protected readonly youtubeSubscribeUrl = YOUTUBE_SUBSCRIBE_URL;

  /**
   * The post on screen. The router reuses this component from one post to the
   * next (same `:slug` route), so everything follows the route's data rather
   * than being read once.
   */
  protected readonly view = signal<ArticleView | null>(null);

  constructor() {
    // route.data replays its current value, so the first post (and the
    // prerendered HTML) is set up right here, synchronously.
    inject(ActivatedRoute).data
      .pipe(takeUntilDestroyed())
      .subscribe((data) => this.view.set(this.show(data['article'] as ArticleData)));
  }

  /** The view of one post, with its meta tags and schema applied. */
  private show({ source, text }: ArticleData): ArticleView {
    const locale = this.i18n.locale();
    const original = BLOG_POSTS.find((p) => p.slug === source);
    const post = original && translateBlogPost(original, locale, this.i18n.content().blog[source]);
    if (!post || text === undefined) {
      throw new Error(
        `No ${locale} text for blog post "${source}": check blog-posts.registry.ts, translatedPosts in ` +
        `src/i18n/locales.json and src/assets/blogs/, then rerun "npm run generate-blog-content".`
      );
    }
    const extras: ArticleExtras = ARTICLE_EXTRAS[source] ?? {};
    const filled = fillMakerWorldSection(text, extras.makerWorldUrl ?? '');
    const [postContent, postContentAfterVideo] = splitAtVideo(filled);

    // Meta + BlogPosting/BreadcrumbList from the registry or the translation,
    // plus the video the post is built around and its visible FAQ.
    const graph: Record<string, unknown>[] = [];
    const article: Record<string, unknown> = {};
    if (extras.video === 'featured') {
      const video = videoObjectSchema(FEATURED_VIDEO);
      graph.push(video);
      article['video'] = { '@id': video['@id'] };
    }
    const faq = faqFromMarkdown(filled);
    if (faq.length) {
      graph.push(faqPageSchema(faq));
    }
    this.seo.applyBlogPostSeo(source, { article, graph });

    return {
      source,
      extras,
      clip: typeof extras.video === 'object' ? extras.video : null,
      clipCaption: post.videoCaption ?? '',
      postContent,
      postContentAfterVideo
    };
  }
}

/** What the template shows for one post. */
interface ArticleView {
  /** The Bulgarian slug, which keys everything about the post. */
  source: string;
  extras: ArticleExtras;
  clip: { src: string; poster: string } | null;
  clipCaption: string;
  /** The markdown before / after the `<!-- video -->` marker; the player sits between. */
  postContent: string;
  postContentAfterVideo: string;
}
