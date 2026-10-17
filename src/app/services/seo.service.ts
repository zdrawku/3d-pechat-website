import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BLOG_POSTS } from './blog-posts.registry';

export const SITE_ORIGIN = 'https://3dpechat.bg';

/** Extra schema for a post that needs more than BlogPosting + BreadcrumbList. */
export interface BlogPostSeoExtras {
    /** Properties merged into the BlogPosting node (e.g. `video: { '@id': … }`). */
    article?: Record<string, unknown>;
    /** Additional nodes appended to the `@graph` (VideoObject, FAQPage, …). */
    graph?: Record<string, unknown>[];
}

/** FAQPage node for a visible Q&A list; keep the list and the page text in sync. */
export function faqPageSchema(items: { question: string; answer: string }[]): Record<string, unknown> {
    return {
        '@type': 'FAQPage',
        mainEntity: items.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: answer }
        }))
    };
}

export interface SeoConfig {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private readonly defaultImage = `${SITE_ORIGIN}/assets/og-image.png`;
    private readonly siteName = '3D Печат България';

    constructor(
        private title: Title,
        private meta: Meta,
        @Inject(DOCUMENT) private document: Document
    ) { }

    public updateSeo(config: SeoConfig): void {
        // 1. Set Title
        this.title.setTitle(config.title);
        this.updateTag('property', 'og:title', config.title);
        this.updateTag('name', 'twitter:title', config.title);

        // 2. Set Description
        this.updateTag('name', 'description', config.description);
        this.updateTag('property', 'og:description', config.description);
        this.updateTag('name', 'twitter:description', config.description);

        // 3. Set Keywords
        if (config.keywords) {
            this.updateTag('name', 'keywords', config.keywords);
        }

        // 4. Set Image
        const imageUrl = config.image || this.defaultImage;
        this.updateTag('property', 'og:image', imageUrl);
        this.updateTag('name', 'twitter:image', imageUrl);
        this.updateTag('property', 'og:image:width', '1200');
        this.updateTag('property', 'og:image:height', '630');

        // 5. Set URL
        if (config.url) {
            this.setCanonicalUrl(config.url);
            this.updateTag('property', 'og:url', config.url);
        }

        // 6. Set Type
        const type = config.type || 'website';
        this.updateTag('property', 'og:type', type);

        // 7. Twitter Card
        this.updateTag('name', 'twitter:card', 'summary_large_image');

        // 8. Site Name
        this.updateTag('property', 'og:site_name', this.siteName);

        // 9. Article specific tags
        if (config.publishedDate) {
            this.updateTag('property', 'article:published_time', config.publishedDate);
        }
        if (config.modifiedDate) {
            this.updateTag('property', 'article:modified_time', config.modifiedDate);
        }
        if (config.author) {
            this.updateTag('property', 'article:author', config.author);
        }
    }

    /**
     * One call per blog post: the meta/OG/canonical tags plus a single JSON-LD
     * `@graph` holding the BlogPosting and its BreadcrumbList, all derived from
     * the post's entry in blog-posts.registry.ts (the one source of truth for
     * title, description, keywords, image and dates). Throws on an unknown slug
     * so a typo fails the prerender instead of shipping a post with no SEO.
     * `extras` adds post-specific schema (a video, a visible FAQ) to the same graph.
     */
    public applyBlogPostSeo(slug: string, extras: BlogPostSeoExtras = {}): void {
        const post = BLOG_POSTS.find(p => p.slug === slug);
        if (!post) {
            throw new Error(`applyBlogPostSeo: no post with slug "${slug}" in blog-posts.registry.ts`);
        }

        const url = `${SITE_ORIGIN}${post.route.replace(/\/+$/, '')}/`;
        const image = this.absoluteUrl(post.imageUrl) ?? this.defaultImage;
        const keywords = (post.keywords ?? post.tags ?? []).join(', ');
        const datePublished = post.date.toISOString();
        const dateModified = (post.dateModified ?? post.date).toISOString();
        const brand = { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: this.siteName };

        this.updateSeo({
            title: post.seoTitle ?? `${post.title} | ${this.siteName}`,
            description: post.description,
            keywords,
            image,
            url,
            type: 'article',
            author: post.author ?? this.siteName,
            publishedDate: datePublished,
            modifiedDate: dateModified
        });

        this.setStructuredData({
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'BlogPosting',
                    '@id': `${url}#article`,
                    headline: post.title,
                    description: post.description,
                    image,
                    inLanguage: 'bg',
                    keywords,
                    datePublished,
                    dateModified,
                    author: brand,
                    publisher: { ...brand, logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/assets/logo.png` } },
                    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                    ...extras.article
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${url}#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Начало', item: `${SITE_ORIGIN}/` },
                        { '@type': 'ListItem', position: 2, name: 'Блог', item: `${SITE_ORIGIN}/blog/` },
                        { '@type': 'ListItem', position: 3, name: post.title, item: url }
                    ]
                },
                ...(extras.graph ?? [])
            ]
        });
    }

    public setStructuredData(schema: any): void {
        const scriptId = 'structured-data-jsonld';
        let script = this.document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = this.document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            this.document.head.appendChild(script);
        }

        script.text = JSON.stringify(schema);
    }

    public removeStructuredData(): void {
        const scriptId = 'structured-data-jsonld';
        const script = this.document.getElementById(scriptId);
        if (script) {
            script.remove();
        }
    }

    private absoluteUrl(path?: string): string | undefined {
        if (!path) return undefined;
        return /^https?:\/\//.test(path) ? path : `${SITE_ORIGIN}/${path.replace(/^\//, '')}`;
    }

    private updateTag(attr: 'name' | 'property', attrValue: string, content: string): void {
        if (content) {
            this.meta.updateTag({ [attr]: attrValue, content: content });
        }
    }

    private setCanonicalUrl(url: string): void {
        // Check if link-canonical already exists
        let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
    }
}
