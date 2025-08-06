import { test, expect } from '@playwright/test';

test.describe('1Cube E2E Tests', () => {
  test('Complete user flow: login → create campaign → generate content → view dashboard', async ({ page }) => {
    // 1. Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/1Cube/);
    
    // 2. Navigate to login
    await page.click('text=Login');
    await expect(page).toHaveURL('/auth/login');
    
    // 3. Login with demo credentials
    await page.fill('input[type="email"]', 'demo@1cube.id');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Sign In")');
    
    // 4. Wait for dashboard to load
    await page.waitForURL('/app');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // 5. Verify KPIs are displayed
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=ROAS')).toBeVisible();
    await expect(page.locator('text=CAC')).toBeVisible();
    await expect(page.locator('text=AOV')).toBeVisible();
    await expect(page.locator('text=LTV')).toBeVisible();
    
    // 6. Navigate to Campaigns
    await page.click('a[href="/app/campaigns"]');
    await expect(page).toHaveURL('/app/campaigns');
    await expect(page.locator('h1')).toContainText('Campaigns');
    
    // 7. Create a new campaign
    await page.click('button:has-text("Create Campaign")');
    await page.waitForSelector('text=Create New Campaign');
    
    // Fill campaign details
    await page.fill('input[placeholder*="Valentine"]', 'Test Wellness Campaign');
    await page.selectOption('select', 'conversions');
    await page.fill('input[placeholder="50000000"]', '10000000');
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Select channels
    await page.click('text=Shopee');
    await page.click('text=TikTok Shop');
    
    // Click Next to AI recommendations
    await page.click('button:has-text("Next")');
    
    // Launch campaign
    await page.click('button:has-text("Launch Campaign")');
    
    // 8. Navigate to Content Studio
    await page.click('a[href="/app/content"]');
    await expect(page).toHaveURL('/app/content');
    await expect(page.locator('h1')).toContainText('Content Studio');
    
    // 9. Generate content
    await page.fill('input[placeholder*="Vitamin C Serum"]', 'Test Product');
    await page.selectOption('select', 'skincare');
    await page.fill('textarea', 'Brightens skin, reduces dark spots');
    
    // Select language (Bahasa)
    await page.click('button:has-text("Bahasa")');
    
    // Select angle (Transformation)
    await page.click('text=Transformation Story');
    
    // Generate content
    await page.click('button:has-text("Generate Content")');
    
    // Wait for content generation
    await page.waitForSelector('text=No content generated yet', { state: 'hidden' });
    
    // 10. Navigate back to dashboard
    await page.click('a[href="/app"]');
    await expect(page).toHaveURL('/app');
    
    // 11. Verify dashboard shows updated data
    await expect(page.locator('text=Revenue Trend')).toBeVisible();
    await expect(page.locator('text=Channel Revenue Mix')).toBeVisible();
    await expect(page.locator('text=Recent Alerts')).toBeVisible();
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check mobile menu button is visible
    await expect(page.locator('button:has(svg)')).toBeVisible();
    
    // Navigate to login
    await page.click('text=Login');
    
    // Login form should be responsive
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Indonesian locale formatting', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'demo@1cube.id');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('/app');
    
    // Check currency formatting
    const revenueText = await page.locator('text=Rp').first().textContent();
    expect(revenueText).toMatch(/Rp\s*[\d.,]+/);
    
    // Navigate to orders to check date formatting
    await page.click('a[href="/app/orders"]');
    await page.waitForURL('/app/orders');
    
    // Date should be in Indonesian format
    const dateElements = await page.locator('text=/\\d{1,2}\\s+\\w+\\s+\\d{4}/').all();
    expect(dateElements.length).toBeGreaterThan(0);
  });

  test('Chatbot functionality', async ({ page }) => {
    // Login and navigate to chatbot
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'demo@1cube.id');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('/app');
    await page.click('a[href="/app/chatbot"]');
    await expect(page).toHaveURL('/app/chatbot');
    
    // Navigate to test widget tab
    await page.click('text=Test Widget');
    
    // Send a test message
    await page.fill('input[placeholder="Type a message..."]', 'What products do you have?');
    await page.press('input[placeholder="Type a message..."]', 'Enter');
    
    // Check for bot response
    await page.waitForSelector('text=wellness products');
  });

  test('Creatives Lab iframe loads', async ({ page }) => {
    // Login and navigate to Creatives Lab
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'demo@1cube.id');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('/app');
    await page.click('a[href="/app/creatives-lab"]');
    await expect(page).toHaveURL('/app/creatives-lab');
    
    // Check iframe exists and loads
    const iframe = page.frameLocator('iframe#creatives-lab-iframe');
    await expect(iframe.locator('text=1Cube Creatives Lab')).toBeVisible({ timeout: 10000 });
  });
});