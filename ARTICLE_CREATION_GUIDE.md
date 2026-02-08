# Complete Guide: Adding New Articles to 3D Печат Website

**Last Updated:** February 8, 2026

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
│   │   └── how-to-make-money-with3d-printing/  # Another article
│   ├── services/
│   │   └── blog.service.ts               # Register articles here
│   ├── models/
│   │   └── blog-post.model.ts            # BlogPost interface
│   └── app.routes.ts                     # Add routes here
├── assets/
│   └── blogs/
│       ├── what-is-3d-printing.md        # Markdown content
│       ├── how-to-make-money.md          # Markdown content
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
import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-your-article-slug',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './your-article-slug.component.html',
  styleUrls: ['./your-article-slug.component.scss'],
})
export class YourArticleSlugComponent implements OnInit {
  postContent = '';
  
  constructor(
    private meta: Meta,
    private title: Title,
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    // SEO Title (appears in browser tab and search results)
    this.title.setTitle('Your SEO Optimized Title - 3D Печат България');
    
    // Meta Tags for SEO and Social Sharing
    this.meta.addTags([
      // Basic SEO
      { name: 'description', content: 'Your compelling 150-160 character description here.' },
      { name: 'keywords', content: 'keyword1, keyword2, keyword3, 3D принтиране' },
      
      // Canonical URL (prevent duplicate content)
      { rel: 'canonical', href: 'https://3dpechat.bg/blog/your-article-slug' },
      
      // Open Graph Tags (Facebook, LinkedIn)
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: 'Your SEO Optimized Title' },
      { property: 'og:description', content: 'Your description here' },
      { property: 'og:url', content: 'https://3dpechat.bg/blog/your-article-slug' },
      { property: 'og:image', content: 'https://3dpechat.bg/assets/blogs/images/your-hero-image.png' },
      
      // Twitter Card Tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Your SEO Optimized Title' },
      { name: 'twitter:description', content: 'Your description here' },
      { name: 'twitter:image', content: 'https://3dpechat.bg/assets/blogs/images/your-hero-image.png' }
    ]);
    
    // Add structured data for rich snippets
    this.addStructuredData();
  }

  ngOnInit() {
    // Load markdown content - slug must match the .md filename
    this.blogService.getPost("your-article-slug").subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  private addStructuredData(): void {
    const blogPost = this.blogService.getPostByRoute('/blog/your-article-slug');
    if (!blogPost) return;

    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": blogPost.title,
      "description": blogPost.description,
      "author": {
        "@type": "Organization",
        "name": blogPost.author || "3D Печат България"
      },
      "datePublished": blogPost.date.toISOString(),
      "dateModified": blogPost.date.toISOString(),
      "image": "https://3dpechat.bg/assets/blogs/images/your-hero-image.png",
      "publisher": {
        "@type": "Organization",
        "name": "3D Печат България",
        "logo": {
          "@type": "ImageObject",
          "url": "https://3dpechat.bg/assets/og-image.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://3dpechat.bg${blogPost.route}`
      },
      "keywords": blogPost.tags?.join(', ') || ''
    });
    this.renderer.appendChild(this.document.head, script);
  }
}
```

**Key Points:**
- Replace all `your-article-slug` with actual slug
- Replace `YourArticleSlugComponent` with PascalCase class name
- Update ALL meta tag content
- Ensure image URLs are correct and absolute (with https://)
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

### Step 4: Register in Blog Service

**File:** `src/app/services/blog.service.ts`

Add your article to the `blogPosts` array:

```typescript
private blogPosts: BlogPost[] = [
  // ... existing posts
  {
    id: '3', // Increment the ID
    title: 'Your Full Article Title - Include Keywords',
    description: 'Compelling description under 160 characters that appears in search results.',
    slug: 'your-article-slug', // Must match .md filename
    route: '/blog/your-article-slug', // Must match route in app.routes.ts
    date: new Date('2026-02-08'), // Publication date
    tags: ['3D принтиране', 'keyword2', 'keyword3'], // For filtering
    author: '3D Печат България'
  }
];
```

**Notes:**
- `slug` must match your `.md` filename (without extension)
- `route` must match the route in `app.routes.ts`
- `tags` are used for search/filtering in the blog list page
- Keep description under 160 characters for optimal display in search results

---

### Step 5: Add Route

**File:** `src/app/app.routes.ts`

Import your component at the top:

```typescript
import { YourArticleSlugComponent } from './blog/your-article-slug/your-article-slug.component';
```

Add route in the `blog` children array:

```typescript
{
  path: 'blog',
  children: [
    { path: '', component: BlogListPageComponent, data: { text: 'Blog' } },
    // ... existing routes
    { path: 'your-article-slug', component: YourArticleSlugComponent }
  ]
}
```

**Important:**
- Route path must match the slug in `blog.service.ts`
- No leading slash in the path
- Order doesn't matter, but keep alphabetical for readability

---

### Step 6: Update Sitemap

Run the sitemap generation script:

```bash
npm run generate-sitemap
```

This automatically:
- Scans all routes in `app.routes.ts`
- Generates `src/sitemap.xml`
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

Every article must have:

#### 1. Title Tag
```typescript
this.title.setTitle('Your Title - 3D Печат България');
```
- **Length:** 50-60 characters
- **Include:** Main keyword + brand
- **Example:** "Как да изберете 3D принтер 2026 - 3D Печат"

#### 2. Meta Description
```typescript
{ name: 'description', content: 'Your description here.' }
```
- **Length:** 150-160 characters
- **Include:** Main keyword, call to action
- **Compelling:** Encourage clicks from search results

#### 3. Keywords
```typescript
{ name: 'keywords', content: 'keyword1, keyword2, keyword3' }
```
- **Count:** 5-10 relevant keywords
- **Mix:** Broad and specific terms
- **Bulgarian:** Use Bulgarian keywords for Bulgarian content

#### 4. Canonical URL
```typescript
{ rel: 'canonical', href: 'https://3dpechat.bg/blog/your-article-slug' }
```
- **Prevents:** Duplicate content issues
- **Always:** Use absolute URL with https://

#### 5. Open Graph Tags
For social media previews (Facebook, LinkedIn):

```typescript
{ property: 'og:type', content: 'article' },
{ property: 'og:title', content: 'Your Title' },
{ property: 'og:description', content: 'Your description' },
{ property: 'og:url', content: 'https://3dpechat.bg/blog/your-slug' },
{ property: 'og:image', content: 'https://3dpechat.bg/assets/blogs/images/hero.png' }
```

**Image Requirements:**
- **Size:** 1200x630px (recommended)
- **Format:** JPG or PNG
- **Size:** Under 300KB

#### 6. Twitter Card Tags
```typescript
{ name: 'twitter:card', content: 'summary_large_image' },
{ name: 'twitter:title', content: 'Your Title' },
{ name: 'twitter:description', content: 'Your description' },
{ name: 'twitter:image', content: 'https://3dpechat.bg/assets/blogs/images/hero.png' }
```

#### 7. Structured Data (JSON-LD)
Added automatically via `addStructuredData()` method
- Provides rich snippets in search results
- Shows author, date, publisher info
- Improves click-through rates

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
- `slug` in `blog.service.ts`
- `route` path in `blog.service.ts`
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
5. 🏷️ Add meta tags and structured data
6. 📝 Register in `blog.service.ts`
7. 🛣️ Add route to `app.routes.ts`
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
