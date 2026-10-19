# Complete Guide: Adding New Articles to 3D Печат Website

**Last Updated:** October 17, 2026

> ⚠️ **[`CLAUDE.md`](CLAUDE.md) Rule 5 and [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md) win wherever this guide disagrees.**
> **Since 2026-10-19 posts have no component or route of their own** — the
> per-post component and route steps below are obsolete. A post is its
> markdown (`src/assets/blogs/<slug>.md`) plus its `blog-posts.registry.ts`
> entry; one component (`src/app/blog/article/`) serves every post in every
> language. Steps: AI_INSTRUCTIONS.md § Adding Articles Manually.
> In short:
> - Post metadata lives in `blog-posts.registry.ts`, not `blog.service.ts`.
> - The article component calls `applyBlogPostSeo('<slug>')`; nothing hand-writes meta tags or JSON-LD.
> - One `:slug` route per language serves every post (`src/app/blog/article/article.routes.ts`).
> - Internal links and canonicals end in `/`.
> - Service claims come from `src/data/business.json`.
> - The preferred way to add a post is `npm run generate-blog`.

This guide provides a step-by-step process for adding new blog articles to the 3D Печат website. Follow these instructions carefully to ensure proper SEO, styling, and functionality.

---

## 📋 Table of Contents

1. [Quick Checklist](#quick-checklist)
2. [Project Structure Overview](#project-structure-overview)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Content & Markdown Best Practices](#content--markdown-best-practices)
5. [Image Guidelines](#image-guidelines)
6. [SEO & Meta Tags Reference](#seo--meta-tags-reference)
7. [Testing & Deployment](#testing--deployment)
8. [Common Pitfalls](#common-pitfalls)

---

## Quick Checklist

Before starting, ensure you have:
- [ ] Article content written in Bulgarian
- [ ] Images optimized and ready (WebP or PNG/JPG)
- [ ] Article slug/URL decided (e.g., `best-3d-printers-2026`)
- [ ] SEO title and description (under 160 chars for description)
- [ ] Keywords/tags identified
- [ ] Hero image prepared
- [ ] At least 2 relevant internal blog links selected

---

## Project Structure Overview

```
src/
├── app/
│   ├── blog/
│   │   ├── shared/
│   │   │   └── blog-styles.scss          # Shared styles for ALL articles
│   │   ├── what-is-3d-printing/          # Example article component
│   │   │   ├── what-is-3d-printing.component.ts
│   │   │   ├── what-is-3d-printing.component.html
│   │   │   ├── what-is-3d-printing.component.scss
│   │   │   └── what-is-3d-printing.component.spec.ts
│   │   └── kak-da-pechelim-ot-3d-printiraneto/  # Another article
│   ├── services/
│   │   ├── blog-posts.registry.ts        # Register articles here (metadata + SEO source)
│   │   ├── seo.service.ts                # applyBlogPostSeo(), faqPageSchema()
│   │   └── blog.service.ts               # Serves bundled markdown (don't register here)
│   ├── models/
│   │   └── blog-post.model.ts            # BlogPost interface
│   └── app.routes.ts                     # Add routes here
├── assets/
│   └── blogs/
│       ├── what-is-3d-printing.md        # Markdown content
│       ├── kak-da-pechelim-ot-3d-printiraneto.md  # Markdown content
│       └── images/                       # Blog-specific images
│           ├── hero-image-how-to-make-money.png
│           └── design-is-from-question.png
└── sitemap.xml                           # Auto-generated
```

---

## Step-by-Step Guide

### Step 1: Create the Markdown Content

**Location:** `src/assets/blogs/your-article-slug.md`

**Naming Convention:** Use kebab-case matching your slug (e.g., `best-3d-printers-2026.md`)

**Template Structure:**

```markdown
# Your Article Title Here
**Време за четене: X мин.**

Brief introduction paragraph that hooks the reader.

![Hero Image Alt Text](assets/blogs/images/hero-image-your-article.png)

## Main Section Heading

Content goes here...

### Subsection

More content...

## Another Section

* Bullet point 1
* Bullet point 2

### Tables (if needed)

| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data     | Data     | Data     |

## Conclusion

Final thoughts...
```

**Important Markdown Tips:**
- Use `#` for H1 (only ONE per article - your title)
- Use `##` for main sections (H2)
- Use `###` for subsections (H3)
- Always include alt text for images
- Use relative paths for images starting with `assets/`
- Add at least 2 contextual internal links to other blog posts using root-relative URLs like `/blog/what-is-3d-printing`
- Keep paragraphs short for readability (2-4 sentences)

---

### Step 2: Add Images

**Location:** `src/assets/blogs/images/`

**Best Practices:**

1. **File Naming:**
   - Use descriptive kebab-case names
   - Examples: `hero-image-best-printers.png`, `fdm-vs-sla-comparison.jpg`

2. **Optimization:**
   - **Hero images:** Max 1920x1080px, under 200KB
   - **Inline images:** Max 1200px width, under 150KB
   - **Format:** WebP preferred, PNG/JPG acceptable
   - Use tools like TinyPNG or Squoosh to compress

3. **Image Syntax in Markdown:**
   ```markdown
   ![Descriptive Alt Text](assets/blogs/images/your-image.png)
   ```

4. **Responsive Images:**
   - The shared blog styles automatically handle responsive sizing
   - Images scale to 100% width on mobile
   - Add meaningful alt text for accessibility and SEO

**Image Guidelines for Beautiful Content:**

- **Hero Image:** Place at the top after the intro paragraph
- **Section Images:** One per major section (H2) when relevant
- **Diagrams/Charts:** Use high contrast, readable text
- **Screenshots:** Crop to relevant area, add borders if needed
- **Avoid:** Stock photos that look generic or out of place

---

### Step 3: Create the Angular Component

**Location:** `src/app/blog/your-article-slug/`

#### 3.1: Generate Component Files

Create four files:

1. `your-article-slug.component.ts`
2. `your-article-slug.component.html`
3. `your-article-slug.component.scss`
4. `your-article-slug.component.spec.ts` (optional)

#### 3.2: TypeScript Component (`your-article-slug.component.ts`)

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-your-article-slug',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './your-article-slug.component.html',
  styleUrls: ['./your-article-slug.component.scss'],
})
export class YourArticleSlugComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    // Title, description, keywords, canonical (with trailing slash), Open Graph,
    // Twitter and a BlogPosting + BreadcrumbList JSON-LD @graph, all from the
    // post's entry in blog-posts.registry.ts. Rendered at prerender time.
    this.seoService.applyBlogPostSeo('your-article-slug');
  }

  ngOnInit() {
    // Load markdown content - slug must match the .md filename
    this.blogService.getPost('your-article-slug').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
```

**Key Points:**
- Replace all `your-article-slug` with actual slug
- Replace `YourArticleSlugComponent` with PascalCase class name
- **Never** call `updateSeo`/`setStructuredData`/`meta.addTags` in a post. All SEO comes from the registry entry (Step 4).
- A post with a visible FAQ or a video passes extra schema:
  `applyBlogPostSeo(slug, { graph: [faqPageSchema(FAQ), videoObjectSchema(video)] })`. See
  `monetna-karta-bulgarski-evro-moneti` and `3d-pechat-po-porachka-sofia-video`.
- A slug missing from the registry throws and fails the build on purpose.
- The `getPost()` slug parameter must match your `.md` filename

#### 3.3: HTML Template (`your-article-slug.component.html`)

```html
<article class="blog-container">
    <button igxButton="contained" (click)="goBack()" class="back-button">
        <igx-icon>arrow_back</igx-icon>
        Back to Articles
    </button>
    <markdown [data]="postContent"></markdown>
</article>
<app-related-content slug="your-article-slug"></app-related-content>
```

**Important:**
- Always wrap in `<article>` for semantic HTML
- Use the `blog-container` class for styling
- The `markdown` component automatically renders your MD file
- The `[data]` binding connects to `postContent` from TypeScript

#### 3.4: SCSS Styles (`your-article-slug.component.scss`)

```scss
// Import shared blog styles
@import '../shared/blog-styles.scss';

// Add any component-specific styles below if needed
// Example: custom button colors, unique layouts, etc.
```

**Critical:**
- **ALWAYS** import `../shared/blog-styles.scss`
- This provides all typography, spacing, responsive design, dark mode support
- Only add component-specific overrides if absolutely necessary

---

### Step 4: Register in the Blog Registry

**File:** `src/app/services/blog-posts.registry.ts`

Add your article to the `BLOG_POSTS` array, above the
`// Add more blog posts here as you create them` marker. The scripts parse this
file by regex, so keep the shape:

```typescript
  {
    id: '19', // Next free ID
    title: 'Your Full Article Title - Include Keywords',
    description: 'Compelling description, 150-160 characters, shown in search results.',
    seoTitle: 'Optional <title> when it must differ from "<title> | <brand>"',
    slug: 'your-article-slug', // Must match .md filename
    route: '/blog/your-article-slug', // No trailing slash here; the canonical adds it
    date: new Date('2026-10-17'), // Publication date
    imageUrl: 'assets/blogs/images/your-article-slug-cover.webp',
    tags: ['3D принтиране', 'keyword2', 'keyword3'], // Card labels
    author: '3D Печат България',
    keywords: ['keyword1', 'keyword2', '3D печат'], // SEO meta keywords
    dateModified: new Date('2026-10-17') // Bump on every substantive content edit
  },
```

**Notes:**
- `slug` must match your `.md` filename (without extension)
- `route` must match the route in `app.routes.ts`
- `dateModified` feeds the sitemap `<lastmod>`, the schema and `article:modified_time`. Bump it by hand when the content changes. Never use the build date.
- `blog-posts.registry.spec.ts` checks unique ids/slugs/routes, that the markdown exists, and that `dateModified` isn't before `date`

---

### Step 5: Add Route

**File:** `src/app/app.routes.ts`

Add a **lazy** route in the `blog` children array. Do **not** add a static
`import … from './blog/…'` line at the top: it pulls the article into the main
bundle and breaks the auto-blog scaffolder.

```typescript
{
  path: 'your-article-slug',
  loadComponent: () => import('./blog/your-article-slug/your-article-slug.component').then(m => m.YourArticleSlugComponent)
},
```

**Important:**
- Route path must match the slug in `blog-posts.registry.ts`
- No leading slash in the path
- Renaming or removing a post later? Keep the old path as a `LegacyRedirectComponent` route and record it in `LEGACY_REDIRECTS.md`. See CLAUDE.md Rule 5.

---

### Step 6: Update Sitemap

Run the sitemap generation script:

```bash
npm run generate-sitemap
```

This automatically:
- Reads every post (route + `dateModified`) from `blog-posts.registry.ts`
- Generates `src/sitemap.xml`, with main-page dates from the hand-maintained `MAIN_PAGE_LASTMOD` in `scripts/generate-sitemap.js`
- Includes proper priorities and change frequencies

**Verify:**
After running, check `src/sitemap.xml` includes your new article URL.

---

## Content & Markdown Best Practices

### Writing Style

1. **Hook First:**
   - Start with a compelling stat or problem statement
   - Example: "Over 60% of 3D printer owners never profit from their device. Here's why..."

2. **Structure:**
   - Use descriptive headings (not "Introduction", but "Why 3D Printing Matters")
   - Break content into scannable sections
   - Use lists for actionable items

3. **Bulgarian Language:**
   - Use proper Bulgarian grammar and punctuation
   - Avoid English buzzwords unless commonly used
   - Use quotes properly: „цитат" (not "quote")

4. **SEO-Friendly:**
   - Include keywords naturally in H2/H3 headings
   - First paragraph should contain main keyword
   - Use semantic variations (3D принтиране, 3D принтер, 3D печат)

### Markdown Features

The `ngx-markdown` component supports:

#### ✅ Standard Markdown
```markdown
**Bold text**
*Italic text*
`Inline code`
[Link text](https://example.com)
```

#### ✅ Lists
```markdown
* Unordered list
* Another item
  * Nested item

1. Ordered list
2. Second item
```

#### ✅ Blockquotes
```markdown
> Important quote or callout
> Can span multiple lines
```

#### ✅ Tables
```markdown
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
```

#### ✅ Code Blocks
```markdown
\`\`\`typescript
const example = "code";
\`\`\`
```

#### ❌ Avoid Long Code Blocks on Mobile
- Keep code/formulas short or use **bold** for emphasis
- Long code blocks create horizontal scroll issues

---

## Image Guidelines

### Image Optimization Workflow

1. **Resize:**
   - Hero images: 1920x1080px
   - Content images: 1200px max width
   - Thumbnails: 600x400px

2. **Compress:**
   - Use [TinyPNG](https://tinypng.com) or [Squoosh](https://squoosh.app)
   - Target: Under 200KB for heroes, under 100KB for content images

3. **Format:**
   - WebP for modern browsers (best compression)
   - PNG for images with transparency
   - JPG for photos

4. **Save:**
   - Location: `src/assets/blogs/images/`
   - Name: `descriptive-kebab-case-name.extension`

### Image Usage in Markdown

```markdown
![Descriptive Alt Text](assets/blogs/images/your-image.png)
```

**Alt Text Best Practices:**
- Describe what's in the image
- Include keywords when natural
- Keep under 125 characters
- Example: "FDM 3D printer printing a blue vase in PLA filament"

### Responsive Behavior

The shared styles automatically handle:
- Full width on mobile (100%)
- Max width on desktop (prevents oversized images)
- Proper spacing (margins)
- Dark mode adjustments

---

## SEO & Meta Tags Reference

### Meta Tag Checklist

You don't write any of these tags. `applyBlogPostSeo('<slug>')` produces all
of them from the post's registry entry. Fill the entry well:

| Registry field | Produces | Guidance |
|---|---|---|
| `title` (or `seoTitle`) | `<title>`, `og:title`, `twitter:title`, schema `headline` | 50–60 characters, main keyword. Without `seoTitle` the title becomes `<title> \| <brand>`. |
| `description` | meta description, `og:`/`twitter:description` | 150–160 characters, main keyword plus a reason to click |
| `keywords` | meta keywords, schema `keywords` | 5–10 Bulgarian phrases, broad and specific mixed |
| `route` | canonical, `og:url`, breadcrumb | Written without the slash; the output is `https://3dpechat.bg/blog/<slug>/` |
| `imageUrl` | `og:image`, `twitter:image`, schema `image` | 1200×630, WebP, under 300 KB, `assets/…` path |
| `date` / `dateModified` | `article:published_time` / `modified_time`, schema dates, sitemap `<lastmod>` | Bump `dateModified` on every substantive edit |

Structured data is a `BlogPosting` + `BreadcrumbList` `@graph`. Add FAQ or
video schema with `applyBlogPostSeo(slug, { graph: [...] })`, never with a
second JSON-LD block.

---

## Testing & Deployment

### Local Testing

1. **Start dev server:**
   ```bash
   npm start
   ```

2. **Test article:**
   - Navigate to `http://localhost:4200/blog/your-article-slug`
   - Check all images load
   - Test "Back to Articles" button
   - Verify styling (especially on mobile)

3. **Test dark mode:**
   - Toggle dark theme
   - Check contrast and readability

4. **Test responsive:**
   - Use browser dev tools (F12)
   - Test mobile (375px), tablet (768px), desktop (1200px+)

### Pre-Deployment Checklist

- [ ] All images load correctly
- [ ] No console errors
- [ ] Links work (internal and external)
- [ ] Meta tags are unique (not copied from another article)
- [ ] Article appears in blog list (`/blog`)
- [ ] Search functionality finds your article
- [ ] Sitemap updated (`npm run generate-sitemap`)
- [ ] Dark mode looks good
- [ ] Mobile layout is readable

### SEO Validation Tools

After deployment, test with:

1. **[Google Rich Results Test](https://search.google.com/test/rich-results)**
   - Validates structured data
   - Checks for errors

2. **[Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)**
   - Ensures mobile usability
   - Identifies issues

3. **[PageSpeed Insights](https://pagespeed.web.dev/)**
   - Measures performance
   - Suggests optimizations

4. **Meta Tag Checker:**
   - View page source
   - Verify all meta tags present
   - Check for typos in URLs

5. **Social Media Debuggers:**
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)

### Deployment Steps

```bash
# 1. Generate sitemap
npm run generate-sitemap

# 2. Build for production
npm run build

# 3. Test production build locally (optional)
npm run serve:ssr

# 4. Deploy
# (Your hosting-specific command)

# 5. Post-deployment verification
# - Visit live URL
# - Test all links
# - Revalidate with Google tools
```

---

## Common Pitfalls

### ❌ Wrong Image Paths
**Problem:** Images don't load
**Solution:** Always use `assets/` as base path, not `/assets/`
```markdown
✅ ![Alt](assets/blogs/images/image.png)
❌ ![Alt](/assets/blogs/images/image.png)
```

### ❌ Mismatched Slugs
**Problem:** 404 error or markdown doesn't load
**Solution:** Ensure these match exactly:
- `.md` filename (without extension)
- `slug` in `blog-posts.registry.ts`
- `route` path in `blog-posts.registry.ts`
- `applyBlogPostSeo()` parameter in component
- Route in `app.routes.ts`
- `getPost()` parameter in component

### ❌ Forgot Sitemap Update
**Problem:** Article not indexed by Google
**Solution:** Always run `npm run generate-sitemap` before deployment

### ❌ Large Images
**Problem:** Slow page load, poor performance
**Solution:** Compress images under 200KB

### ❌ Missing Alt Text
**Problem:** Poor accessibility and SEO
**Solution:** Always include descriptive alt text

### ❌ Duplicate Meta Tags
**Problem:** Copy-pasted from another article
**Solution:** Customize ALL meta content for each article

### ❌ Wrong OG Image URL
**Problem:** No preview when sharing on social media
**Solution:** Use absolute URLs with `https://`
```typescript
✅ 'https://3dpechat.bg/assets/blogs/images/hero.png'
❌ 'assets/blogs/images/hero.png'
```

### ❌ Forgot to Import Component
**Problem:** Build error, route not found
**Solution:** Import component in `app.routes.ts`

### ❌ Not Using Shared Styles
**Problem:** Inconsistent styling, missing responsive behavior
**Solution:** Always import `../shared/blog-styles.scss`

---

## Quick Reference: File Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Article slug | kebab-case | `best-3d-printers-2026` |
| Markdown file | slug.md | `best-3d-printers-2026.md` |
| Component folder | slug/ | `best-3d-printers-2026/` |
| Component class | PascalCase | `Best3dPrinters2026Component` |
| Component files | slug.component.* | `best-3d-printers-2026.component.ts` |
| Image files | descriptive-kebab-case | `hero-image-best-printers.png` |
| Route path | /blog/slug | `/blog/best-3d-printers-2026` |

---

## Summary: Complete Workflow

1. ✍️ Write content in `assets/blogs/your-slug.md`
2. 🖼️ Add optimized images to `assets/blogs/images/`
3. 📁 Create component folder `app/blog/your-slug/`
4. 💻 Create `.ts`, `.html`, `.scss` files
5. 🏷️ Call `applyBlogPostSeo('<slug>')` in the constructor (no hand-written meta tags)
6. 📝 Register in `blog-posts.registry.ts` (with `keywords` and `dateModified`)
7. 🛣️ Add a lazy `loadComponent` route to `app.routes.ts`
8. 🗺️ Run `npm run generate-sitemap`
9. ✅ Test locally
10. 🚀 Deploy
11. 🔍 Validate with SEO tools
12. 📊 Submit to Google Search Console

---

## Need Help?

- **Styling issues?** Check `src/app/blog/shared/blog-styles.scss`
- **Routing problems?** Verify slug consistency across all files
- **Images not loading?** Check paths start with `assets/`
- **SEO questions?** Review `SEO_GUIDE.md`
- **Build errors?** Check TypeScript imports and component registration

---

**Remember:** Consistency is key! Follow these conventions for every article to maintain code quality and SEO effectiveness.

*This guide should be updated whenever the article creation process changes.*
