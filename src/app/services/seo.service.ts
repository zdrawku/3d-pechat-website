import { Injectable, Inject, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BLOG_POSTS } from './blog-posts.registry';
import business from '../../data/business.json';
import { I18nService } from '../i18n/i18n.service';
import { DEFAULT_LOCALE, LanguageAlternate, Locale, isLocale, languageAlternates, localeDefinition, pagePath } from '../i18n/locales';
import { translateBlogPost } from '../i18n/localized-content';
import type { PageNamespace, TranslationParams } from '../i18n/i18n.types';

export const SITE_ORIGIN = 'https://3dpechat.bg';

/** '3dpechat.bg' — the brand suffix of other languages' <title>s, as in their seo.json. */
const SITE_HOST = new URL(SITE_ORIGIN).host;

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
    /**
     * Language versions of this page (`applyPageSeo` passes every language's);
     * omitted = none, as for a post that exists only in Bulgarian. Every navigation replaces them.
     */
    alternates?: LanguageAlternate[];
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private readonly i18n = inject(I18nService);
    private readonly defaultImage = `${SITE_ORIGIN}/assets/og-image.png`;
    /** Entity name (og:site_name, schema publisher/author) — must match the map listing. */
    private readonly siteName = business.name;
    /** Brand suffix in <title>s; kept separate so a rename doesn't rewrite every title. */
    private readonly titleBrand = business.titleBrand;

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

        // 8b. Language: og:locale and hreflang alternates, set on every navigation
        // so a Bulgarian-only page drops the previous page's links. <html lang>
        // belongs to I18nService (it follows the route's language).
        const alternates = config.alternates ?? [];
        this.updateTag('property', 'og:locale', this.i18n.definition().ogLocale);
        this.setOgLocaleAlternates(alternates
            .map(a => a.hreflang)
            .filter((code): code is Locale => isLocale(code) && code !== this.i18n.locale())
            .map(code => localeDefinition(code).ogLocale));
        this.setLanguageAlternates(alternates);

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
     * Meta, canonical and hreflang for one of the pages that exist in every
     * language, in the active language: copy from `seo.<page>` in
     * src/i18n/<lang>/seo.json, canonical '/en/prices/' on English pages, and
     * the page's version in every language. `params` fill the description's
     * {placeholders} (prices: numbers from business.json, formatted for the language).
     */
    public applyPageSeo(page: PageNamespace, params?: TranslationParams): void {
        const path = pagePath(page);
        this.updateSeo({
            title: this.i18n.t(`seo.${page}.title`),
            description: this.i18n.t(`seo.${page}.description`, params),
            keywords: this.i18n.t(`seo.${page}.keywords`),
            url: `${SITE_ORIGIN}${this.i18n.path(path)}`,
            type: 'website',
            alternates: languageAlternates(path, SITE_ORIGIN)
        });
    }

    /**
     * One call per blog post: the meta/OG/canonical tags plus a single JSON-LD
     * `@graph` holding the BlogPosting and its BreadcrumbList, all derived from
     * the post's entry in blog-posts.registry.ts (the one source of truth for
     * title, description, keywords, image and dates) — or, on another
     * language's page, from that translation's copy (src/i18n/<lang>/content/blog.json).
     * `slug` is always the Bulgarian slug. A post with translations lists them as
     * hreflang alternates. Throws on an unknown slug or a missing translation, so
     * a typo fails the prerender instead of shipping a post with no SEO.
     * `extras` adds post-specific schema (a video, a visible FAQ) to the same graph.
     */
    public applyBlogPostSeo(slug: string, extras: BlogPostSeoExtras = {}): void {
        const source = BLOG_POSTS.find(p => p.slug === slug);
        if (!source) {
            throw new Error(`applyBlogPostSeo: no post with slug "${slug}" in blog-posts.registry.ts`);
        }
        const locale = this.i18n.locale();
        const post = translateBlogPost(source, locale, this.i18n.content().blog[slug]);
        if (!post) {
            throw new Error(`applyBlogPostSeo: "${slug}" has no "${locale}" version — see translatedPosts in src/i18n/locales.json and src/i18n/${locale}/content/blog.json`);
        }

        const path = `${post.route.replace(/\/+$/, '')}/`;
        const url = `${SITE_ORIGIN}${path}`;
        const image = this.absoluteUrl(post.imageUrl) ?? this.defaultImage;
        const keywords = (post.keywords ?? post.tags ?? []).join(', ');
        const datePublished = post.date.toISOString();
        const dateModified = (post.dateModified ?? post.date).toISOString();
        const brand = { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: this.siteName };
        // Bulgarian titles keep business.json's brand; other languages use the
        // domain, as their main pages' titles do (src/i18n/<lang>/seo.json).
        const titleBrand = locale === DEFAULT_LOCALE ? this.titleBrand : SITE_HOST;

        this.updateSeo({
            title: post.seoTitle ?? `${post.title} | ${titleBrand}`,
            description: post.description,
            keywords,
            image,
            url,
            type: 'article',
            author: post.author ?? this.siteName,
            publishedDate: datePublished,
            modifiedDate: dateModified,
            alternates: languageAlternates(path, SITE_ORIGIN)
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
                    inLanguage: locale,
                    keywords,
                    datePublished,
                    dateModified,
                    author: brand,
                    publisher: { ...brand, logo: { '@type': 'ImageObject', url: business.logo } },
                    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                    ...extras.article
                },
                {
                    '@type': 'BreadcrumbList',
                    '@id': `${url}#breadcrumb`,
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: this.i18n.t('shell.drawer.home.title'), item: `${SITE_ORIGIN}${this.i18n.path('/')}` },
                        { '@type': 'ListItem', position: 2, name: this.i18n.t('shell.drawer.blog.title'), item: `${SITE_ORIGIN}${this.i18n.path('/blog/')}` },
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

    /** One og:locale:alternate per other language — only on pages that have language versions. */
    private setOgLocaleAlternates(ogLocales: string[]): void {
        this.meta.getTags("property='og:locale:alternate'").forEach(tag => this.meta.removeTagElement(tag));
        for (const content of ogLocales) {
            this.meta.addTag({ property: 'og:locale:alternate', content });
        }
    }

    private setLanguageAlternates(alternates: LanguageAlternate[]): void {
        this.document.head
            .querySelectorAll('link[rel="alternate"][hreflang]')
            .forEach(link => link.remove());
        for (const { hreflang, href } of alternates) {
            const link = this.document.createElement('link');
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', hreflang);
            link.setAttribute('href', href);
            this.document.head.appendChild(link);
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
