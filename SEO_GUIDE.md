# SEO Configuration for Blog Pages

> **📘 Looking to add a new article?** See the comprehensive [ARTICLE_CREATION_GUIDE.md](./ARTICLE_CREATION_GUIDE.md) for complete step-by-step instructions on creating blog posts, including content structure, image optimization, and component setup.

## ✅ Already Implemented

### 1. Meta Tags
All blog components have proper meta tags:
- **Title tags** - Unique, descriptive titles
- **Meta descriptions** - Compelling descriptions for search results
- **Keywords** - Relevant keywords for targeting

### 2. Sitemap
- **Location**: `src/sitemap.xml`
- **Includes**: All blog posts and main pages
- **Auto-generation**: Run `npm run generate-sitemap` to update automatically
- **Declared in**: `robots.txt`

### 3. Robots.txt
- **Location**: `src/robots.txt`
- Allows all crawlers
- Points to sitemap

### 4. Semantic HTML
- Blog content uses proper HTML structure (h1, h2, h3, p, etc.)
- Articles wrapped in `<article>` tags

### 5. Internal Linking
- Blog listing page links to all blog posts
- Tag-based filtering helps with content discovery

---

## 📋 SEO Checklist for Each New Blog

> **💡 Detailed instructions:** For a complete step-by-step guide on adding articles, see [ARTICLE_CREATION_GUIDE.md](./ARTICLE_CREATION_GUIDE.md)

**Quick checklist:**

1. ✅ **Add to blog service** (`src/app/services/blog.service.ts`)
   - Include proper title, description, and tags
   - Set correct date and route

2. ✅ **Set meta tags** in component TypeScript
   ```typescript
   this.title.setTitle('Your SEO Title Here');
   this.meta.addTags([
     { name: 'description', content: 'Your meta description' },
     { name: 'keywords', content: 'keyword1, keyword2, keyword3' }
   ]);
   ```

3. ✅ **Update sitemap** - Run before deploying:
   ```bash
   npm run generate-sitemap
   ```

4. ✅ **Deploy changes**

---

## 🚀 Additional SEO Recommendations

### Priority: HIGH

#### 1. Add Structured Data (JSON-LD)
Add schema.org markup to blog pages for rich snippets:

```typescript
// In your blog component
private addStructuredData(): void {
  const script = this.renderer.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "Your Blog Title",
    "description": "Your blog description",
    "author": {
      "@type": "Organization",
      "name": "3D Печат България"
    },
    "datePublished": "2026-02-08",
    "dateModified": "2026-02-08",
    "image": "https://3dpechat.bg/assets/blog-image.jpg",
    "publisher": {
      "@type": "Organization",
      "name": "3D Печат България",
      "logo": {
        "@type": "ImageObject",
        "url": "http://3dpechat.bg/assets/og-image.png"
      }
    }
  });
  this.renderer.appendChild(document.head, script);
}
```

#### 2. Add Canonical URLs
Prevent duplicate content issues:

```typescript
// In each blog component
this.meta.addTag({ rel: 'canonical', href: 'https://3dpechat.bg/blog/your-blog-url' });
```

#### 3. Open Graph Tags (Social Media)
For better social media sharing:

```typescript
this.meta.addTags([
  { property: 'og:type', content: 'article' },
  { property: 'og:title', content: 'Your Blog Title' },
  { property: 'og:description', content: 'Your description' },
  { property: 'og:url', content: 'https://3dpechat.bg/blog/your-blog' },
  { property: 'og:image', content: 'https://3dpechat.bg/assets/blog-image.jpg' },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: 'Your Blog Title' },
  { name: 'twitter:description', content: 'Your description' },
  { name: 'twitter:image', content: 'https://3dpechat.bg/assets/blog-image.jpg' }
]);
```

### Priority: MEDIUM

#### 4. Consider Angular Universal (SSR)
**Why?** Google can crawl JavaScript apps, but SSR improves:
- Initial load time
- SEO for other search engines
- Social media preview generation

**How to add:**
```bash
ng add @angular/ssr
```

#### 5. Add Blog Images
- Featured images for each blog post
- Alt text for all images
- Optimized file sizes (WebP format)

#### 6. Internal Linking Strategy
- Link to related blog posts
- Add "You might also like" section
- Link from main pages to blog

### Priority: LOW (Nice to Have)

#### 7. XML Sitemap for Images
If you add many images to blogs

#### 8. RSS Feed
For blog subscribers

#### 9. Reading Time Indicator
Already in markdown, but make it structured data

#### 10. Blog Breadcrumbs
```
Home > Blog > Article Title
```

---

## 🔍 Current SEO Status

### ✅ What's Good
- Clean URLs (`/blog/what-is-3d-printing`)
- Meta tags present
- Sitemap configured
- Mobile responsive
- Fast loading (Ignite UI optimized)
- Bulgarian language content (local SEO)

### ⚠️ What Could Be Better
- No structured data (JSON-LD)
- No Open Graph tags
- Client-side rendering only (consider SSR)
- No canonical URLs
- Missing blog images

---

## 📊 Monitoring & Verification

After deploying, verify SEO setup:

1. **Google Search Console**
   - Submit sitemap: `https://3dpechat.bg/sitemap.xml`
   - Check indexing status
   - Monitor search performance

2. **Test Tools**
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
   - [PageSpeed Insights](https://pagespeed.web.dev/)

3. **Manual Checks**
   - Test: `site:3dpechat.bg/blog` in Google
   - Verify meta tags in browser dev tools
   - Check sitemap.xml is accessible

---

## 🔄 Deployment Workflow

Before each deployment:

```bash
# 1. Generate sitemap
npm run generate-sitemap

# 2. Build for production
npm run build

# 3. Deploy to hosting
# (your deployment command)

# 4. After deployment, submit to Google Search Console
```

---

## 📝 Quick Reference

### Sitemap Update Command
```bash
npm run generate-sitemap
```

### Adding New Blog - Checklist
- [ ] Create component files
- [ ] Create markdown content
- [ ] Add to blog.service.ts
- [ ] Add to app.routes.ts
- [ ] Set proper meta tags
- [ ] Run generate-sitemap
- [ ] Test locally
- [ ] Deploy
- [ ] Submit to Google Search Console

---

## 🆘 Common Issues

**Q: Google not indexing my blog pages?**
- Submit sitemap in Google Search Console
- Check robots.txt allows crawling
- Internal links from other pages help
- Can take 1-4 weeks for new content

**Q: Blog not showing in search results?**
- Check meta tags are unique
- Ensure content is high-quality (300+ words)
- Build backlinks to your blog
- Be patient - SEO takes time

**Q: Need faster indexing?**
- Use "Request Indexing" in Google Search Console
- Share on social media (signals to Google)
- Get backlinks from other sites

---

*Last updated: February 8, 2026*
