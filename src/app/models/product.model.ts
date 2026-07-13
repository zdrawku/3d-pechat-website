/**
 * Product data shape as stored in `src/data/products.json` (imported at build
 * time). This is pure data — no runtime UI state lives here.
 *
 * `featured` + `pageUrl` turn an entry into a "MAIN product": `featured` pins it
 * as a banner at the top of the catalog and surfaces it as a child item under
 * „Продукти“ in the nav drawer; `pageUrl` gives it its own page (e.g. the gift
 * box configurator at `/gift-box`) instead of the default "order via /contact"
 * prefill flow. Both are optional — a product without them behaves as before.
 */
export interface Product {
  id: number;
  linkId: string;
  name: string;
  description: string;
  frontImage?: string;
  backImage?: string;
  dateAdded?: string;
  hasOldCoins: boolean;
  hasEuroCoins: boolean;
  hasImagePadding?: boolean;
  /** Marks a MAIN product: pinned banner on /products + child nav item. */
  featured?: boolean;
  /** Own page (e.g. '/gift-box') instead of the /contact order prefill. */
  pageUrl?: string;
  customContent?: {
    show: boolean;
    title: string;
    items: string[];
  };
  tags?: string[];
}

/**
 * Runtime view of a {@link Product}: the data plus the transient UI state that
 * the card grid mutates. `showFront` tracks which side of a flippable card is
 * visible — it is deliberately *not* part of the persisted product data.
 */
export interface ProductVariant extends Product {
  showFront: boolean;
}
