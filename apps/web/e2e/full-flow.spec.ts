import { expect, test } from '@playwright/test';

const SEEDED_PRODUCT_SLUG = 'nimbus-laptop-stand';
const SEEDED_PRODUCT_NAME = /Nimbus Aluminum Laptop Stand/i;

function uniqueEmail(): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `e2e-${stamp}@example.com`;
}

test.describe('full purchase flow', () => {
  test('register → view product → add to cart → checkout → order created', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'PlaywrightPass123!';

    await test.step('register a new account', async () => {
      await page.goto('/signup');
      await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();

      await page.getByLabel('First name').fill('Play');
      await page.getByLabel('Last name').fill('Wright');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: /Create account/i }).click();

      await expect(page).toHaveURL('/', { timeout: 15_000 });
    });

    await test.step('open the product page for a seeded item', async () => {
      await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
      await expect(page.getByRole('heading', { name: SEEDED_PRODUCT_NAME })).toBeVisible();
    });

    await test.step('add the product to cart', async () => {
      await page.getByRole('button', { name: /Add to cart/i }).click();

      const drawer = page.getByRole('dialog', { name: /Your Cart/i });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText(SEEDED_PRODUCT_NAME)).toBeVisible();
      await expect(drawer.getByRole('button', { name: /Checkout/i })).toBeEnabled();
    });

    await test.step('go to checkout and fill shipping', async () => {
      await page.getByRole('button', { name: /Checkout/i }).click();
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(page.getByRole('heading', { name: /Shipping address/i })).toBeVisible();

      await page.getByLabel('First name').fill('Play');
      await page.getByLabel('Last name').fill('Wright');
      await page.getByLabel('Address line 1').fill('1 Test Lane');
      await page.getByLabel('City').fill('Tel Aviv');
      await page.getByLabel('State / Region').fill('TA');
      await page.getByLabel('Postal code').fill('6100000');
      await page.getByLabel(/Country/i).fill('IL');
      await page.getByLabel('Phone').fill('+972500000000');

      await page.getByRole('button', { name: /Continue to payment/i }).click();
    });

    await test.step('fill payment with the 4242 test card', async () => {
      await expect(page.getByRole('heading', { name: /Payment/i })).toBeVisible();
      // The Payment form pre-fills 4242…; explicitly set the holder name and confirm.
      await page.getByLabel('Name on card').fill('Play Wright');
      // Card number is pre-filled to 4242 4242 4242 4242 — keep the default.
      await page.getByRole('button', { name: /Review order/i }).click();
    });

    await test.step('place the order on the review step', async () => {
      await expect(page.getByRole('heading', { name: /Review and place order/i })).toBeVisible();
      await page.getByRole('button', { name: /^Place order$/i }).click();
    });

    await test.step('lands on the order detail page with PAID status', async () => {
      await expect(page).toHaveURL(/\/account\/orders\/[a-z0-9-]+/, { timeout: 20_000 });
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { name: /Order #/i })).toBeVisible();
      await expect(main.getByText(/PAID/i).first()).toBeVisible();
      await expect(main.getByText(SEEDED_PRODUCT_NAME)).toBeVisible();
      await expect(main.getByText(/ending in 4242/i)).toBeVisible();
    });

    await test.step('order also appears in the order history', async () => {
      await page.goto('/account/orders');
      await expect(page.getByRole('heading', { name: /Your orders/i })).toBeVisible();
      await expect(page.getByText(/PAID/i).first()).toBeVisible();
    });
  });
});
