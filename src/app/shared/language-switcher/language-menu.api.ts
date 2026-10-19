/**
 * What the deferred language menu hands the switcher once it exists. A plain
 * interface on purpose: if the switcher referenced LanguageMenuComponent's
 * class in its code (a viewChild query, say), Angular could no longer defer
 * the menu and its drop-down module would be back in the initial bundle.
 */
export interface LanguageMenuHandle {
  toggle(): void;
  handleKeyDown(event: KeyboardEvent): void;
}
