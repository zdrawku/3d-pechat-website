import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import blogMessages from '../../../../i18n/bg/blog.json';
import { I18nService } from '../../../i18n/i18n.service';
import { blogPostLocales, blogPostPath } from '../../../i18n/locales';
import { LocalizePathPipe, TranslatePipe } from '../../../i18n/translate.pipe';

/**
 * The row above every article (approved design „B“, artifact "English Blog
 * Variants"): a link back to the blog in the page's language and, for a post
 * that exists in other languages, a „Прочетете на английски“ / "Read in
 * Bulgarian" link to each version (src/i18n/locales.json `translatedPosts`).
 * A post that exists only in Bulgarian shows just the back link.
 */
@Component({
  selector: 'app-article-toolbar',
  imports: [RouterLink, IgxButtonDirective, IgxIconComponent, TranslatePipe, LocalizePathPipe],
  templateUrl: './article-toolbar.component.html',
  styleUrls: ['./article-toolbar.component.scss']
})
export class ArticleToolbarComponent {
  /** The post's Bulgarian slug (its key in blog-posts.registry.ts), on every language's page. */
  readonly slug = input.required<string>();

  protected readonly i18n = inject(I18nService);

  /** The post in every other language it exists in, with a slash-free link (TrailingSlashUrlSerializer adds it). */
  protected readonly versions = computed(() =>
    blogPostLocales(this.slug())
      .filter((code) => code !== this.i18n.locale())
      .map((code) => ({
        code,
        url: (blogPostPath(this.slug(), code) as string).replace(/\/$/, ''),
        language: this.i18n.languageName(code)
      }))
  );

  constructor() {
    this.i18n.registerPage('blog', blogMessages);
  }
}
