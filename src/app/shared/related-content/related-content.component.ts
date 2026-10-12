import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent } from 'igniteui-angular';

import { BlogPost } from '../../models/blog-post.model';
import { Product } from '../../models/product.model';
import { BlogService } from '../../services/blog.service';
import { pickRelatedPosts, pickRelatedProducts } from './related-content.util';
import productsData from '../../../data/products.json';

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
 */
@Component({
  selector: 'app-related-content',
  imports: [RouterLink, IGX_CARD_DIRECTIVES, IgxButtonDirective, IgxIconComponent],
  templateUrl: './related-content.component.html',
  styleUrls: ['./related-content.component.scss']
})
export class RelatedContentComponent implements OnInit {
  /** The current article's slug, as registered in BlogService. */
  @Input({ required: true }) slug!: string;

  public posts: BlogPost[] = [];
  public products: Product[] = [];

  constructor(private readonly blogService: BlogService) {}

  ngOnInit(): void {
    // getAllPosts() is an `of(...)`, so this runs synchronously — the result is
    // in place before the prerender snapshot is taken.
    this.blogService.getAllPosts().subscribe((all) => {
      const current = all.find((p) => p.slug === this.slug);
      if (!current) {
        return;
      }
      this.posts = pickRelatedPosts(current, all, 3);
      this.products = pickRelatedProducts(current, productsData as Product[], 3);
    });
  }

  /** Blog `imageUrl`s are stored without a leading slash; the page URL is nested, so anchor it. */
  public imageSrc(post: BlogPost): string {
    return `/${(post.imageUrl ?? 'assets/og-image.png').replace(/^\//, '')}`;
  }
}
