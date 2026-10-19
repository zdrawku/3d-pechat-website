import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import blogMessages from '../../../i18n/bg/blog.json';
import { I18nService } from '../../i18n/i18n.service';
import { localizeProduct, translateBlogPost } from '../../i18n/localized-content';
import { LocalizePathPipe, TranslatePipe } from '../../i18n/translate.pipe';
import { BlogPost } from '../../models/blog-post.model';
import { Product } from '../../models/product.model';
import { BlogService } from '../../services/blog.service';
import { pickRelatedPosts, pickRelatedProducts } from './related-content.util';
import productsData from '../../../data/products.json';

/** A related product, with `lang` set when its copy is still Bulgarian on another language's page. */
type RelatedProduct = Product & { copyLang: string | null };

/**
 * Block under every blog article (approved design: „A — две секции"):
 * „Продължете да четете" (3 related articles) and „Може да ви хареса"
 * (3 catalog products). It keeps readers on the site and gives crawlers more
 * internal links to follow.
 *
 * Nothing is curated by hand: {@link pickRelatedPosts} / {@link pickRelatedProducts}
 * match on tags and title words, so a post added by the auto-blog gets a sensible
 * block with no extra work. Products come from `src/data/products.json`, imported
 * at build time like everywhere else, so the links are in the prerendered HTML.
 *
 * On another language's page (a translated post) the posts are matched on
 * their copy in that language, among the posts translated into it; products
 * are matched on the Bulgarian original (their tags are Bulgarian) and shown
 * with their copy in that language.
 */
@Component({
  selector: 'app-related-content',
  imports: [RouterLink, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent, TranslatePipe, LocalizePathPipe],
  templateUrl: './related-content.component.html',
  styleUrls: ['./related-content.component.scss']
})
export class RelatedContentComponent {
  /**
   * The current article's Bulgarian slug (its key in blog-posts.registry.ts),
   * on every language's page. The article page is reused from post to post,
   * so every new slug picks the block again.
   */
  @Input({ required: true })
  set slug(slug: string) {
    this.currentSlug = slug;
    this.pick();
  }
  get slug(): string {
    return this.currentSlug;
  }
  private currentSlug = '';

  protected readonly i18n = inject(I18nService);

  public posts: BlogPost[] = [];
  public products: RelatedProduct[] = [];

  constructor(private readonly blogService: BlogService) {
    this.i18n.registerPage('blog', blogMessages);
  }

  private pick(): void {
    this.posts = [];
    this.products = [];
    // getAllPosts() is an `of(...)`, so this runs synchronously — the result is
    // in place before the prerender snapshot is taken.
    this.blogService.getAllPosts().subscribe((all) => {
      const current = all.find((p) => p.slug === this.currentSlug);
      if (!current) {
        return;
      }
      const locale = this.i18n.locale();
      const { blog, products } = this.i18n.content();
      const inLocale = (post: BlogPost) => translateBlogPost(post, locale, blog[post.slug]);
      const here = inLocale(current);
      this.posts = here ? pickRelatedPosts(here, all.flatMap((post) => inLocale(post) ?? []), 3) : [];
      // Products are matched on the Bulgarian post: their tags are Bulgarian.
      this.products = pickRelatedProducts(current, productsData as Product[], 3).map((product) => ({
        ...localizeProduct(product, products[product.linkId]),
        copyLang: products[product.linkId] ? null : this.i18n.langIfForeign()
      }));
    });
  }

  /** Blog `imageUrl`s are stored without a leading slash; the page URL is nested, so anchor it. */
  public imageSrc(post: BlogPost): string {
    return `/${(post.imageUrl ?? 'assets/og-image.png').replace(/^\//, '')}`;
  }
}
