import { Injectable, InjectionToken, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../environments/environment';

/** SHA-256 (hex) the passphrase must hash to. Overridable in tests. */
export const STUDIO_PASSPHRASE_HASH = new InjectionToken<string>('STUDIO_PASSPHRASE_HASH', {
  providedIn: 'root',
  factory: () => environment.studioPassphraseHash
});

/** Prefix that is hashed together with the passphrase (must match how environment.ts's hash was made). */
const SALT = '3dpechat.bg/studio:';
const STORAGE_KEY = 'bookmark-studio-unlock';

/** The passphrase as the hex SHA-256 of `SALT + passphrase`. */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const bytes = new TextEncoder().encode(SALT + passphrase);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The Studio's passphrase gate.
 *
 * This is a SOFT gate that keeps customers on the order path. It is not
 * security: the site is static, so the hash and this code are public (and the
 * engine is a public MIT package anyway). Only a hash of the passphrase is kept
 * — never the passphrase itself, in the repo or anywhere else. After a correct
 * entry the unlock is remembered in localStorage on that device, until "Lock".
 */
@Injectable({ providedIn: 'root' })
export class StudioGateService {
  private readonly expectedHash = inject(STUDIO_PASSPHRASE_HASH);
  private readonly platformId = inject(PLATFORM_ID);

  /** Always false while prerendering: the page renders the gate only. */
  readonly unlocked = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.unlocked.set(this.remembered());
    }
  }

  /** Unlocks when `passphrase` hashes to the stored hash; returns whether it did. */
  async unlock(passphrase: string): Promise<boolean> {
    if ((await hashPassphrase(passphrase)) !== this.expectedHash) {
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEY, this.expectedHash);
    } catch {
      // Private mode: stays unlocked until the page closes.
    }
    this.unlocked.set(true);
    return true;
  }

  lock(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing was stored.
    }
    this.unlocked.set(false);
  }

  /** A remembered unlock counts only for the current hash, so changing the passphrase locks every device. */
  private remembered(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === this.expectedHash;
    } catch {
      return false;
    }
  }
}
