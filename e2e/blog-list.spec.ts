import { test, expect } from '@playwright/test';

/**
 * Blog list coverage: search, tag-click filtering, and — most valuable — a
 * data-driven guarantee that every card in the list links to a page that
 * actually renders. That last test automatically covers any newly added blog
 * without needing a new test.
 */
test.describe('blog list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('lists posts and the count matches rendered cards', async ({ page }) => {
    const cards = page.getByTestId('blog-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await expect(page.getByTestId('blog-result-count')).toContainText(String(count));
  });

  test('search narrows the list', async ({ page }) => {
    const cards = page.getByTestId('blog-card');
    const initial = await cards.count();

    await page.getByTestId('blog-search').fill('warhammer');
    await expect(cards).not.toHaveCount(initial);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('a gibberish query shows the no-results state', async ({ page }) => {
    await page.getByTestId('blog-search').fill('zzz-няма-такава-статия');
    await expect(page.getByTestId('blog-card')).toHaveCount(0);
    await expect(page.locator('.no-results')).toBeVisible();
  });

  test('clicking a tag filters by that tag', async ({ page }) => {
    const firstTag = page.getByTestId('blog-tag').first();
    const tagText = (await firstTag.innerText()).trim();
    await firstTag.click();

    // searchByTag() sets the search box to the tag text and re-filters.
    await expect(page.getByTestId('blog-search')).toHaveValue(tagText);
    const cards = page.getByTestId('blog-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('every listed blog card links to a page that renders', async ({ page }) => {
    // Collect every card's destination href, then visit each and assert the
    // post renders a heading. This is the regression net for "adding a blog":
    // a new post that 404s or fails to render will fail here automatically.
    const hrefs = await page.getByTestId('blog-card').evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute('href')).filter(Boolean) as string[],
    );
    expect(hrefs.length).toBeGreaterThan(0);

    for (const href of hrefs) {
      const res = await page.goto(href);
      expect(res?.status(), `status for ${href}`).toBeLessThan(400);
      await expect(page.locator('h1, h2').first(), `heading on ${href}`).toBeVisible();
    }
  });
});
