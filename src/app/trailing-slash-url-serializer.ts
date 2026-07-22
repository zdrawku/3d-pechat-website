import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/**
 * Serializes routes with a trailing slash so internal links match the canonical
 * URLs. The site prerenders to directories (blog/index.html), which GitHub Pages
 * serves at /blog/ and 301-redirects /blog to. Without this, every [routerLink]
 * emitted href="/blog" and Googlebot only ever discovered the redirecting form —
 * which it reports as a "Redirect error" instead of indexing the target.
 *
 * The router's DefaultUrlSerializer drops the empty trailing segment, so a
 * trailing slash cannot be expressed via [routerLink] values themselves.
 */
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    const url = super.serialize(tree);

    // Split off ?query and #fragment — the slash belongs on the path only.
    const separatorIndex = url.search(/[?#]/);
    const path = separatorIndex === -1 ? url : url.slice(0, separatorIndex);
    const suffix = separatorIndex === -1 ? '' : url.slice(separatorIndex);

    return path.endsWith('/') ? url : `${path}/${suffix}`;
  }
}
