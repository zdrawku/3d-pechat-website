import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

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
    private readonly defaultImage = 'https://3dpechat.bg/assets/og-image.png';
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
