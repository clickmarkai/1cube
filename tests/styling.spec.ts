import { test, expect } from '@playwright/test';

test.describe('1Cube Styling Tests', () => {
  test('Homepage styling is applied correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });
    
    // Test 1: Check if Tailwind classes are working
    const h1 = page.locator('h1').first();
    const h1Color = await h1.evaluate(el => window.getComputedStyle(el).color);
    console.log('H1 color:', h1Color);
    
    // Test 2: Check if our primary color is applied
    const primaryColorElement = page.locator('.text-primary').first();
    const primaryColor = await primaryColorElement.evaluate(el => window.getComputedStyle(el).color);
    console.log('Primary color element:', primaryColor);
    
    // Test 3: Check if buttons have correct styling
    const primaryButton = page.locator('.btn-primary').first();
    const buttonBgColor = await primaryButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const buttonTextColor = await primaryButton.evaluate(el => window.getComputedStyle(el).color);
    console.log('Primary button background:', buttonBgColor);
    console.log('Primary button text color:', buttonTextColor);
    
    // Test 4: Check if gradient background is applied
    const mainDiv = page.locator('div').first();
    const bgImage = await mainDiv.evaluate(el => window.getComputedStyle(el).backgroundImage);
    console.log('Background image/gradient:', bgImage);
    
    // Test 5: Check specific elements
    const navBg = await page.locator('nav').evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Nav background:', navBg);
    
    // Test 6: Check if custom CSS classes exist
    const cardExists = await page.locator('.card').count();
    console.log('Number of .card elements:', cardExists);
    
    // Assertions
    expect(h1Color).not.toBe(''); // Should have some color
    expect(buttonBgColor).not.toBe(''); // Should have background color
    expect(cardExists).toBeGreaterThan(0); // Should have card elements
  });
  
  test('Test page styling verification', async ({ page }) => {
    // Navigate to test page
    await page.goto('/test');
    
    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/test-page.png', fullPage: true });
    
    // Check inline styles (should always work)
    const inlineStyleElement = page.locator('h1').first();
    const inlineColor = await inlineStyleElement.evaluate(el => window.getComputedStyle(el).color);
    console.log('Inline style color:', inlineColor);
    expect(inlineColor).toBe('rgb(255, 0, 0)'); // Red color
    
    // Check Tailwind classes
    const tailwindElement = page.locator('.text-red-500').first();
    const tailwindColor = await tailwindElement.evaluate(el => window.getComputedStyle(el).color);
    console.log('Tailwind text-red-500 color:', tailwindColor);
    
    // Check custom button class
    const customButton = page.locator('.btn-primary').first();
    const customButtonBg = await customButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Custom button background:', customButtonBg);
    
    // Check if Tailwind utilities are working
    const blueButton = page.locator('.bg-blue-500').first();
    const blueBg = await blueButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log('Tailwind bg-blue-500:', blueBg);
    
    // Log all stylesheets loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => sheet.href || 'inline');
    });
    console.log('Loaded stylesheets:', stylesheets);
  });
  
  test('Check CSS file is loaded', async ({ page }) => {
    // Check network requests for CSS files
    const cssResponses: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.css') || response.headers()['content-type']?.includes('text/css')) {
        cssResponses.push(response.url());
      }
    });
    
    await page.goto('/');
    
    console.log('CSS files loaded:', cssResponses);
    expect(cssResponses.length).toBeGreaterThan(0);
  });
});