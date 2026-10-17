// Writes the markdown asset, scaffolds the Angular component (ts/html/scss),
// registers the post in BlogService and adds the route to app.routes.ts.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BLOG_DIR = path.join(ROOT, 'src/app/blog');
const ASSETS_DIR = path.join(ROOT, 'src/assets/blogs');
const SERVICE_FILE = path.join(ROOT, 'src/app/services/blog-posts.registry.ts');
const ROUTES_FILE = path.join(ROOT, 'src/app/app.routes.ts');

function pascalCaseFromSlug(slug) {
  // Special handling: leading "3d-" becomes "ThreeD" to match existing convention.
  let s = slug;
  if (/^3d-/.test(s)) s = 'three-d-' + s.slice(3);
  const name = s
    .split('-')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  // A TS class name can't start with a digit (e.g. slug "1-po-barzi-…").
  return /^\d/.test(name) ? `Blog${name}` : name;
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

function buildComponentTs(slug, pascalName) {
  // All SEO (title, description, canonical, OG tags, BlogPosting + BreadcrumbList
  // JSON-LD) comes from this post's entry in blog-posts.registry.ts via one call.
  return `import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-${slug}',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
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
    this.seoService.applyBlogPostSeo('${slug}');
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

// "Related articles / products" block under the article (see
// src/app/shared/related-content) — matched automatically, no per-post setup.
const buildComponentHtml = (slug) => `<article class="blog-container">
    <button igxButton="contained" (click)="goBack()" class="back-button">
        <igx-icon>arrow_back</igx-icon>
        Back to Articles
    </button>
    <markdown [data]="postContent"></markdown>
</article>
<app-related-content slug="${slug}"></app-related-content>
`;

const COMPONENT_SCSS = `// Use shared blog styles
@use '../shared/blog-styles';

// Add any component-specific styles below if needed
`;

function writeComponent(slug, pascalName) {
  const dir = path.join(BLOG_DIR, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.component.ts`), buildComponentTs(slug, pascalName), 'utf8');
  fs.writeFileSync(path.join(dir, `${slug}.component.html`), buildComponentHtml(slug), 'utf8');
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

  const literal = list => `[${list.map(t => `'${escapeForSingleQuotes(t)}'`).join(', ')}]`;
  const keywords = String(seo.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
  const entry = `  {
    id: '${nextId}',
    title: '${escapeForSingleQuotes(seo.title)}',
    description: '${escapeForSingleQuotes(seo.description)}',
    slug: '${slug}',
    route: '/blog/${slug}',
    date: new Date('${seo.publishDate}'),
    imageUrl: '${coverImageAssetPath || 'assets/og-image.png'}',
    tags: ${literal(seo.tags)},
    author: '3D Печат България',
    keywords: ${literal(keywords)},
    dateModified: new Date('${seo.publishDate}')
  }`;

  // Insert before the "// Add more blog posts here" comment if it exists,
  // otherwise before the closing `];` of the BLOG_POSTS array. The previous
  // entry is followed by a comma already, so only add one if it's missing.
  const marker = '// Add more blog posts here';
  let updated;
  if (src.includes(marker)) {
    updated = src.replace(/(})(,?)(\s*\n\s*\/\/ Add more blog posts here)/, `$1,\n${entry},$3`);
  } else {
    updated = src.replace(/(\n\s*)\];/, `,\n${entry}$1];`);
  }
  if (updated === src) throw new Error('Could not insert blog entry into blog-posts.registry.ts');
  fs.writeFileSync(SERVICE_FILE, updated, 'utf8');
  return nextId;
}

function updateRoutes(slug, pascalName) {
  const src = fs.readFileSync(ROUTES_FILE, 'utf8');
  const className = `${pascalName}Component`;

  // Blog routes are lazy: every child is
  //   { path: '<slug>',
  //     loadComponent: () => import('./blog/<slug>/<slug>.component').then(m => m.<Class>) }
  // There are deliberately NO static `import … from './blog/…'` lines at the top
  // of this file — adding one would eagerly pull the chunk into the main bundle
  // and undo the lazy loading.
  if (new RegExp(`path:\\s*'${slug.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'`).test(src)) {
    console.log('[scaffold] route already present, skipping');
    return;
  }

  // Append the route inside the blog children array, before its closing `]`.
  const blogChildrenRegex = /(path:\s*'blog'\s*,\s*children:\s*\[)([\s\S]*?)(\n\s*\]\s*\})/;
  const match = src.match(blogChildrenRegex);
  if (!match) throw new Error('Could not locate blog children array in app.routes.ts');

  const before = match[1];
  const body = match[2].replace(/\s*$/, '');
  const after = match[3];
  const newRoute =
    `,\n      {\n` +
    `        path: '${slug}',\n` +
    `        loadComponent: () => import('./blog/${slug}/${slug}.component')` +
    `.then(m => m.${className})\n` +
    `      }`;
  const updated = src.replace(blogChildrenRegex, `${before}${body}${newRoute}${after}`);

  if (updated === src) throw new Error('Failed to insert the blog route into app.routes.ts');
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

  const { assetPath } = require('./generate-image');
  const coverAsset = coverImagePath ? assetPath(slug) : 'assets/og-image.png';
  const mdPath = writeMarkdown(slug, article.markdown);
  const compDir = writeComponent(slug, pascalName);
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

// updateRoutes is exported for the route-format check in
// scripts/auto-blog/verify-routes.js (it must stay in sync with the lazy
// `loadComponent` shape used by src/app/app.routes.ts).
module.exports = { scaffoldArticle, pascalCaseFromSlug, updateRoutes };
