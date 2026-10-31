import { TestBed } from '@angular/core/testing';

import { STUDIO_PASSPHRASE_HASH, StudioGateService, hashPassphrase } from './studio-gate.service';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'bookmark-studio-unlock';
/** A throwaway passphrase for the specs — never the real one. */
const TEST_PASSPHRASE = 'spec-only passphrase';

describe('StudioGateService', () => {
  let testHash: string;

  async function gate(): Promise<StudioGateService> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: STUDIO_PASSPHRASE_HASH, useValue: testHash }] });
    return TestBed.inject(StudioGateService);
  }

  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    testHash = await hashPassphrase(TEST_PASSPHRASE);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('stores only a SHA-256 hash in the environment config, never a passphrase', () => {
    expect(environment.studioPassphraseHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('starts locked', async () => {
    expect((await gate()).unlocked()).toBeFalse();
  });

  it('stays locked on a wrong passphrase', async () => {
    const service = await gate();
    expect(await service.unlock('wrong')).toBeFalse();
    expect(service.unlocked()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('unlocks on the right one and remembers it on this device', async () => {
    const service = await gate();
    expect(await service.unlock(TEST_PASSPHRASE)).toBeTrue();
    expect(service.unlocked()).toBeTrue();

    expect((await gate()).unlocked()).withContext('a fresh visit on the same device').toBeTrue();
  });

  it('locks again, and forgets', async () => {
    const service = await gate();
    await service.unlock(TEST_PASSPHRASE);
    service.lock();
    expect(service.unlocked()).toBeFalse();
    expect((await gate()).unlocked()).toBeFalse();
  });

  it('does not honour an unlock remembered for a different passphrase', async () => {
    localStorage.setItem(STORAGE_KEY, 'hash-of-an-old-passphrase');
    expect((await gate()).unlocked()).toBeFalse();
  });

  it('hashes the same input the same way', async () => {
    expect(await hashPassphrase('a')).toBe(await hashPassphrase('a'));
    expect(await hashPassphrase('a')).not.toBe(await hashPassphrase('b'));
  });
});
