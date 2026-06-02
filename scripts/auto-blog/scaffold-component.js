// Writes the markdown asset, scaffolds the Angular component (ts/html/scss),
// registers the post in BlogService and adds the route to app.routes.ts.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BLOG_DIR = path.join(ROOT, 'src/app/blog');
const ASSETS_DIR = path.join(ROOT, 'src/assets/blogs');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog.service.ts');
const ROUTES_FILE = path.join(ROOT, 'src/app/app.routes.ts');

function pascalCaseFromSlug(slug) {
  // Special handling: leading "3d-" becomes "ThreeD" to match existing convention.
  let s = slug;
  if (/^3d-/.test(s)) s = 'three-d-' + s.slice(3);
  return s
    .split('-')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function ensureUniqueSlug(slug) {
  let candidate = slug;
  let i = 2;
  while (
    fs.existsSync(path.join(BLOG_DIR, candidate)) ||
    fs.existsSync(path.join(ASSETS_DIR, `${candidate}.md`))
  ) {
    candidate = `${slug}-${i++}`;
  }
  return candidate;
}

function writeMarkdown(slug, markdown) {
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
  const file = path.join(ASSETS_DIR, `${slug}.md`);
  fs.writeFileSync(file, markdown, 'utf8');
  return file;
}

function buildComponentTs(slug, pascalName, seo, coverImageAssetPath) {
  const isoDate = new Date(seo.publishDate).toISOString();
  const headline = seo.title.replace(/'/g, "\\'");
  const description = seo.description.replace(/'/g, "\\'");
  const keywords = seo.keywords.replace(/'/g, "\\'");
  const coverImageUrl = `https://3dpechat.bg/${coverImageAssetPath || 'assets/real-images/main-images/3dprinting-hero.jpg'}`;
  return `import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-${slug}',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule],
  templateUrl: './${slug}.component.html',
  styleUrls: ['./${slug}.component.scss'],
})
export class ${pascalName}Component implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.updateSeo({
      title: '${headline} | 3D Печат България',
      description: '${description}',
      keywords: '${keywords}',
      url: 'https://3dpechat.bg/blog/${slug}',
      image: '${coverImageUrl}',
      type: 'article',
      author: '3D Печат България',
      publishedDate: new Date('${seo.publishDate}').toISOString(),
      modifiedDate: new Date('${seo.publishDate}').toISOString()
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${headline}",
      "description": "${description}",
      "author": {
        "@type": "Organization",
        "name": "3D Печат България"
      },
      "datePublished": "${isoDate}",
      "dateModified": "${isoDate}",
      "image": "${coverImageUrl}",
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
        "@id": "https://3dpechat.bg/blog/${slug}"
      },
      "keywords": "${keywords}"
    });
  }

  ngOnInit() {
    this.blogService.getPost('${slug}').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
`;
}

const COMPONENT_HTML = `<article class="blog-container">
    <button igxButton="contained" (click)="goBack()" class="back-button">
        <igx-icon>arrow_back</igx-icon>
        Back to Articles
    </button>
    <markdown [data]="postContent"></markdown>
</article>
`;

const COMPONENT_SCSS = `// Use shared blog styles
@use '../shared/blog-styles';

// Add any component-specific styles below if needed
`;

function writeComponent(slug, pascalName, seo, coverImageAssetPath) {
  const dir = path.join(BLOG_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.component.ts`), buildComponentTs(slug, pascalName, seo, coverImageAssetPath), 'utf8');
  fs.writeFileSync(path.join(dir, `${slug}.component.html`), COMPONENT_HTML, 'utf8');
  fs.writeFileSync(path.join(dir, `${slug}.component.scss`), COMPONENT_SCSS, 'utf8');
  return dir;
}

function escapeForSingleQuotes(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function updateBlogService(slug, seo, coverImageAssetPath) {
  const src = fs.readFileSync(SERVICE_FILE, 'utf8');

  // Compute next id from the highest existing numeric id.
  const ids = [...src.matchAll(/id:\s*'(\d+)'/g)].map(m => parseInt(m[1], 10));
  const nextId = String((ids.length ? Math.max(...ids) : 0) + 1);

  const tagsLiteral = `[${seo.tags.map(t => `'${escapeForSingleQuotes(t)}'`).join(', ')}]`;
  const entry = `    ,{
      id: '${nextId}',
      title: '${escapeForSingleQuotes(seo.title)}',
      description: '${escapeForSingleQuotes(seo.description)}',
      slug: '${slug}',
      route: '/blog/${slug}',
      date: new Date('${seo.publishDate}'),
      imageUrl: '${coverImageAssetPath || 'assets/real-images/main-images/3dprinting-hero.jpg'}',
      tags: ${tagsLiteral},
      author: '3D Печат България'
    }`;

  // Insert before the "// Add more blog posts here" comment if it exists,
  // otherwise before the closing `];` of the blogPosts array.
  const marker = '// Add more blog posts here';
  let updated;
  if (src.includes(marker)) {
    updated = src.replace(marker, `${entry}\n    ${marker}`);
  } else {
    updated = src.replace(/(\n\s*)\];/, `\n${entry}$1];`);
  }
  if (updated === src) throw new Error('Could not insert blog entry into blog.service.ts');
  fs.writeFileSync(SERVICE_FILE, updated, 'utf8');
  return nextId;
}

function updateRoutes(slug, pascalName) {
  const src = fs.readFileSync(ROUTES_FILE, 'utf8');
  const className = `${pascalName}Component`;
  const importLine = `import { ${className} } from './blog/${slug}/${slug}.component';`;

  if (src.includes(importLine)) {
    console.log('[scaffold] route import already present, skipping');
    return;
  }

  // Insert the import after the last existing './blog/...' import.
  const importRegex = /^import .* from '\.\/blog\/[^']+';$/gm;
  let lastMatch;
  let m;
  while ((m = importRegex.exec(src)) !== null) lastMatch = m;
  if (!lastMatch) throw new Error('Could not locate existing blog imports in app.routes.ts');
  const insertAt = lastMatch.index + lastMatch[0].length;
  let updated = src.slice(0, insertAt) + '\n' + importLine + src.slice(insertAt);

  // Add the route inside the blog children array, before the closing `]`.
  const blogChildrenRegex = /(path:\s*'blog'\s*,\s*children:\s*\[)([\s\S]*?)(\n\s*\]\s*\})/;
  const match = updated.match(blogChildrenRegex);
  if (!match) throw new Error('Could not locate blog children array in app.routes.ts');
  const before = match[1];
  const body = match[2].replace(/\s*$/, '');
  const after = match[3];
  const newRoute = `,\n      { path: '${slug}', component: ${className} }`;
  updated = updated.replace(blogChildrenRegex, `${before}${body}${newRoute}${after}`);

  fs.writeFileSync(ROUTES_FILE, updated, 'utf8');
}

function scaffoldArticle(article, coverImagePath) {
  const uniqueSlug = ensureUniqueSlug(article.slug);
  if (uniqueSlug !== article.slug) {
    console.warn(`[scaffold] slug collision; using '${uniqueSlug}' instead of '${article.slug}'`);
  }
  const slug = uniqueSlug;
  const pascalName = pascalCaseFromSlug(slug);
  const seo = article.seo;

  const mdPath = writeMarkdown(slug, article.markdown);
  const compDir = writeComponent(slug, pascalName, seo, coverAsset);
  const { assetPath } = require('./generate-image');
  const coverAsset = coverImagePath ? assetPath(slug) : 'assets/real-images/main-images/3dprinting-hero.jpg';
  const id = updateBlogService(slug, seo, coverAsset);
  updateRoutes(slug, pascalName);

  return {
    slug,
    pascalName,
    id,
    markdownFile: path.relative(ROOT, mdPath),
    componentDir: path.relative(ROOT, compDir)
  };
}

module.exports = { scaffoldArticle, pascalCaseFromSlug };
