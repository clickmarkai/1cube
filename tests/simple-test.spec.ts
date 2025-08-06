import { test, expect } from '@playwright/test';

test('Simple test to check if page loads and take screenshot', async ({ page }) => {
  // Navigate to homepage
  console.log('Navigating to homepage...');
  const response = await page.goto('/', { waitUntil: 'networkidle' });
  
  console.log('Response status:', response?.status());
  
  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/current-homepage.png', fullPage: true });
  
  // Check if page loaded
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if body exists
  const bodyExists = await page.locator('body').count();
  console.log('Body element exists:', bodyExists > 0);
  
  // Get all text content
  const textContent = await page.textContent('body');
  console.log('Page content preview:', textContent?.substring(0, 200));
  
  // Check if any stylesheets are loaded
  const stylesheets = await page.evaluate(() => {
    return Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href || 'inline',
      rules: sheet.cssRules ? sheet.cssRules.length : 0
    }));
  });
  console.log('Stylesheets:', JSON.stringify(stylesheets, null, 2));
  
  // Check computed styles of body
  const bodyStyles = await page.locator('body').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      fontFamily: styles.fontFamily
    };
  });
  console.log('Body styles:', bodyStyles);
  
  expect(response?.status()).toBe(200);
});