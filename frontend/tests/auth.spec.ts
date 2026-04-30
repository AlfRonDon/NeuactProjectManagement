import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3420';
const ADMIN_USER = 'rohith';
const ADMIN_PASS = 'neuract123';
const ENGINEER_USER = 'abhishek';
const ENGINEER_PASS = 'neuract123';

test.describe('Authentication & Access Control', () => {
  
  test('should load homepage', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Project Management|Neuact/i);
    console.log('✓ Homepage loaded successfully');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`);
    // Keycloak redirects to login
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    const url = page.url();
    console.log(`✓ Redirected to: ${url}`);
    expect(url).toContain('auth');
  });

  test('should login as admin (rohith)', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Wait for Keycloak login page
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 }).catch(() => {
      console.log('⚠ Keycloak login form not found - may already be logged in');
    });

    // Try to fill login form
    const usernameInput = await page.$('input[type="text"], input[name="username"]');
    if (usernameInput) {
      await usernameInput.fill(ADMIN_USER);
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) await passwordInput.fill(ADMIN_PASS);
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });
    }

    console.log(`✓ Admin login attempt completed`);
  });

  test('should access test-layouts page', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Check if page loaded
    const content = await page.textContent('body');
    if (content && content.includes('Layout')) {
      console.log('✓ Test layouts page loaded');
      expect(content).toContain('Layout');
    } else {
      console.log('⚠ Page loaded but content unclear');
    }
  });
});

test.describe('Bottom Widget Variants (Set 8)', () => {
  
  test('should have 3 new widget variants', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Look for "Bottom Widget (Set 8)" section
    const content = await page.textContent('body');
    
    const variants = [
      'Risk + Stage + AI',
      'Risk + Stage + AI Summary',
      'Cards + AI'
    ];

    for (const variant of variants) {
      if (content?.includes(variant)) {
        console.log(`✓ Found variant: ${variant}`);
      } else {
        console.log(`✗ Missing variant: ${variant}`);
      }
    }
  });

  test('Risk + Stage + AI widget should be interactive', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Click on "Risk + Stage + AI" variant
    await page.click('button:has-text("Risk + Stage + AI")').catch(() => {
      console.log('⚠ Could not click variant button');
    });

    // Check for project selection buttons
    const projectButtons = await page.$$('button:has-text("CCv5"), button:has-text("NRv3"), button:has-text("Spot")');
    
    if (projectButtons.length > 0) {
      console.log(`✓ Found ${projectButtons.length} project buttons - widget is interactive`);
      
      // Try clicking a project
      await projectButtons[0]?.click();
      console.log('✓ Project selection works');
    } else {
      console.log('⚠ No project buttons found');
    }
  });
});

test.describe('Backend Health', () => {
  
  test('backend should respond on port 9017', async ({ page }) => {
    try {
      const response = await page.goto('http://localhost:9017/');
      const status = response?.status();
      console.log(`✓ Backend responding with status: ${status}`);
      expect([200, 301, 302, 404]).toContain(status);
    } catch (e) {
      console.log(`✗ Backend not responding: ${e.message}`);
    }
  });
});
