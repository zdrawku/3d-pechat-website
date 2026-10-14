import { test, expect, Page } from '@playwright/test';

/**
 * YouTube promo video (Idea 7). Guards the two promises of the click-to-play
 * player against the real prerendered build:
 *  1. nothing is requested from YouTube until the visitor presses play;
 *  2. after the click the privacy-enhanced iframe is allowed by our CSP.
 */
const YOUTUBE_HOSTS = /youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com/;

function trackYoutubeRequests(page: Page): string[] {
  const hits: string[] = [];
  page.on('request', (req) => {
    if (YOUTUBE_HOSTS.test(new URL(req.url()).hostname)) {
      hits.push(req.url());
    }
  });
  return hits;
}

/**
 * CSP violations that concern the player: the iframe (`frame-src`) or any
 * YouTube host. Other violations on the page are deliberately ignored here,
 * e.g. Google Analytics picks its collect endpoint per region and on CI it hit
 * `analytics.google.com` / `www.google.com`, which `connect-src` blocks. That
 * is unrelated to the video and must not fail this test.
 */
function trackPlayerCspErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (
      msg.type() === 'error' &&
      /Content Security Policy/i.test(text) &&
      (/frame-src/i.test(text) || YOUTUBE_HOSTS.test(text))
    ) {
      errors.push(text);
    }
  });
  return errors;
}

test.describe('home „Вижте ни в действие“ video', () => {
  test('loads nothing from YouTube until play is pressed', async ({ page }) => {
    const hits = trackYoutubeRequests(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    const section = page.getByTestId('home-video-section');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { name: 'Вижте ни в действие' })).toBeVisible();
    await expect(section.locator('iframe')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(hits, 'YouTube requests before play').toEqual([]);
  });

  test('swaps in the nocookie player on click, allowed by the CSP', async ({ page }) => {
    const cspErrors = trackPlayerCspErrors(page);
    await page.goto('/', { waitUntil: 'networkidle' });

    const section = page.getByTestId('home-video-section');
    await section.getByTestId('youtube-play').click();

    const frame = section.getByTestId('youtube-iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/f8yTuEcOCjU\?.*autoplay=1/);
    // Give the browser a moment to attempt the frame navigation.
    await page.waitForTimeout(1000);
    expect(cspErrors, 'CSP violations after play').toEqual([]);
  });

  test('„Абонирай се“ opens the subscribe confirmation in a new tab', async ({ page }) => {
    await page.goto('/');
    const subscribe = page.getByTestId('home-video-subscribe');
    await expect(subscribe).toHaveAttribute('href', 'https://www.youtube.com/@3dpechatbg?sub_confirmation=1');
    await expect(subscribe).toHaveAttribute('target', '_blank');
    await expect(subscribe).toHaveAttribute('rel', /noopener/);
  });
});

test('video article embeds the player without loading YouTube up front', async ({ page }) => {
  const hits = trackYoutubeRequests(page);
  await page.goto('/blog/3d-pechat-po-porachka-sofia-video', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Вижте как работим');
  await expect(page.getByTestId('article-video').getByTestId('youtube-play')).toBeVisible();
  expect(hits, 'YouTube requests before play').toEqual([]);
});

test('„Виж във видеото“ links open the video at the right second', async ({ page }) => {
  await page.goto('/products');
  for (const [card, seconds] of [['razdeliteli-za-knigi', 9], ['variant-2', 19]] as const) {
    const link = page.locator(`#${card} a[href^="https://youtu.be/f8yTuEcOCjU"]`);
    await expect(link, card).toHaveAttribute('href', `https://youtu.be/f8yTuEcOCjU?t=${seconds}`);
    await expect(link, card).toHaveAttribute('aria-label', 'Виж във видеото');
    await expect(link, card).toHaveAttribute('target', '_blank');
  }
});
