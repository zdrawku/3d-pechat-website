/**
 * Loads hCaptcha (~1.3 MB incl. worker) on demand and resolves with its global.
 * Meant to be called on a form's first interaction, so it stays off the LCP path.
 * The contact page has its own copy of this logic; this one is for new forms.
 */
export interface HcaptchaApi {
  render(container: string | HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
}

const SCRIPT_SRC = 'https://js.hcaptcha.com/1/api.js';
const CALLBACK = 'onHcaptchaLoadShared';

let loading: Promise<HcaptchaApi> | undefined;

const existing = (): HcaptchaApi | undefined => (globalThis as { hcaptcha?: HcaptchaApi }).hcaptcha;

export function loadHcaptcha(): Promise<HcaptchaApi> {
  const ready = existing();
  if (ready) {
    return Promise.resolve(ready);
  }
  loading ??= new Promise<HcaptchaApi>((resolve, reject) => {
    const done = () => {
      const api = existing();
      return api ? resolve(api) : reject(new Error('hCaptcha did not load'));
    };
    // The contact page may already be loading it (its own callback): wait for that script.
    const pending = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`);
    if (pending) {
      pending.addEventListener('load', () => setTimeout(done, 0), { once: true });
      pending.addEventListener('error', () => reject(new Error('hCaptcha did not load')), { once: true });
      return;
    }
    (globalThis as Record<string, unknown>)[CALLBACK] = done;
    const script = document.createElement('script');
    script.src = `${SCRIPT_SRC}?onload=${CALLBACK}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('hCaptcha did not load'));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
