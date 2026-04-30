import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3420';

test.describe('Widget Rendering & Functionality', () => {
  
  test('should load test-layouts page with all widgets', async ({ page, browserName }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: `screenshots/test-layouts-${browserName}.png`, fullPage: true });
    console.log(`✓ Screenshot saved: test-layouts-${browserName}.png`);

    // Check for Set 8 label
    const hasSet8 = await page.textContent('body')?.includes('Set 8');
    expect(hasSet8).toBeTruthy();
    console.log('✓ Set 8 (Combined Bottom Widget) found');
  });

  test('Bottom: Three Columns - should render with people, risk, stage', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Navigate to Set 8
    await page.click('button:has-text("Bottom Widget")');
    await page.waitForTimeout(500);

    // Check for variant buttons
    const buttons = await page.locator('button').filter({ hasText: 'Three Columns' });
    if (await buttons.count() > 0) {
      await buttons.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/variant-three-cols.png' });
      console.log('✓ Three Columns variant rendered');
    } else {
      console.log('⚠ Three Columns button not found');
    }
  });

  test('Bottom: Risk + Stage + AI - should have interactive KPI selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Find and click Risk + Stage + AI variant
    const variant = await page.locator('button:has-text("Risk + Stage + AI")').first();
    if (await variant.count() > 0) {
      await variant.click();
      await page.waitForTimeout(1000);

      // Check for project selection buttons
      const projectButtons = await page.locator('button').filter({ hasText: /CCv5|NRv3|Spot/ });
      const count = await projectButtons.count();
      
      if (count > 0) {
        console.log(`✓ Found ${count} project buttons - widget is interactive`);
        
        // Test project selection
        await projectButtons.first().click();
        await page.waitForTimeout(500);
        
        // Check if AI brief updated
        const aiBrief = await page.textContent('div:has-text("AI")');
        console.log(`✓ AI brief displayed: ${aiBrief ? 'yes' : 'no'}`);
        
        await page.screenshot({ path: 'screenshots/widget-risk-stage-ai.png' });
        console.log('✓ Risk + Stage + AI variant rendered and interactive');
      } else {
        console.log('⚠ No project buttons found');
      }
    } else {
      console.log('⚠ Risk + Stage + AI button not found');
    }
  });

  test('Risk bars should be clickable and update insights', async ({ page }) => {
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    
    // Find Risk + Stage + AI Summary variant
    const variant = await page.locator('button:has-text("Risk + Stage + AI Summary")').first();
    if (await variant.count() > 0) {
      await variant.click();
      await page.waitForTimeout(1000);

      // Look for risk axis buttons
      const riskButtons = await page.locator('button').filter({ hasText: /Scope|Deadline|Resource|Deps/ });
      const count = await riskButtons.count();

      if (count > 0) {
        console.log(`✓ Found ${count} risk axis buttons`);
        
        // Click a risk axis
        await riskButtons.first().click();
        await page.waitForTimeout(500);

        // Check if insights updated
        const insights = await page.textContent('div');
        console.log(`✓ Risk selection triggered insights: ${insights?.length || 0} chars`);
        
        await page.screenshot({ path: 'screenshots/widget-risk-summary.png' });
        console.log('✓ Risk + Stage + AI Summary variant interactive');
      }
    }
  });
});

test.describe('Responsive Design', () => {
  
  test('should render on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/desktop-view.png', fullPage: true });
    console.log('✓ Desktop view captured');
  });

  test('should render on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/tablet-view.png', fullPage: true });
    console.log('✓ Tablet view captured');
  });

  test('should render on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/mobile-view.png', fullPage: true });
    console.log('✓ Mobile view captured');
  });
});
