# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/widgets.spec.ts >> Widget Rendering & Functionality >> Bottom: Three Columns - should render with people, risk, stage
- Location: tests/widgets.spec.ts:20:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Bottom Widget")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]: Neuract Project Management
  - main [ref=e6]:
    - heading "Sign in to your account" [level=1] [ref=e8]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e15]: Username or email
        - textbox "Username or email" [active] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e20]: Password
        - generic [ref=e21]:
          - textbox "Password" [ref=e24]
          - button "Show password" [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: 
        - link "Forgot Password?" [ref=e32] [cursor=pointer]:
          - /url: /keycloak/realms/neuract-project-management/login-actions/reset-credentials?client_id=neuact-pm&tab_id=fq37AmO2Tmk&client_data=eyJydSI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzQyMC90ZXN0LWxheW91dHMvIiwicnQiOiJjb2RlIiwicm0iOiJmcmFnbWVudCIsInN0IjoiYmE5NjU0YWMtNzU1ZC00ODYxLTkxYjQtZTQ2Mzg2YWExYzRiIn0
      - button "Sign In" [ref=e35] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:3420';
  4   | 
  5   | test.describe('Widget Rendering & Functionality', () => {
  6   |   
  7   |   test('should load test-layouts page with all widgets', async ({ page, browserName }) => {
  8   |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  9   |     
  10  |     // Take screenshot
  11  |     await page.screenshot({ path: `screenshots/test-layouts-${browserName}.png`, fullPage: true });
  12  |     console.log(`✓ Screenshot saved: test-layouts-${browserName}.png`);
  13  | 
  14  |     // Check for Set 8 label
  15  |     const hasSet8 = await page.textContent('body')?.includes('Set 8');
  16  |     expect(hasSet8).toBeTruthy();
  17  |     console.log('✓ Set 8 (Combined Bottom Widget) found');
  18  |   });
  19  | 
  20  |   test('Bottom: Three Columns - should render with people, risk, stage', async ({ page }) => {
  21  |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  22  |     
  23  |     // Navigate to Set 8
> 24  |     await page.click('button:has-text("Bottom Widget")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  25  |     await page.waitForTimeout(500);
  26  | 
  27  |     // Check for variant buttons
  28  |     const buttons = await page.locator('button').filter({ hasText: 'Three Columns' });
  29  |     if (await buttons.count() > 0) {
  30  |       await buttons.first().click();
  31  |       await page.waitForTimeout(1000);
  32  |       await page.screenshot({ path: 'screenshots/variant-three-cols.png' });
  33  |       console.log('✓ Three Columns variant rendered');
  34  |     } else {
  35  |       console.log('⚠ Three Columns button not found');
  36  |     }
  37  |   });
  38  | 
  39  |   test('Bottom: Risk + Stage + AI - should have interactive KPI selection', async ({ page }) => {
  40  |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  41  |     
  42  |     // Find and click Risk + Stage + AI variant
  43  |     const variant = await page.locator('button:has-text("Risk + Stage + AI")').first();
  44  |     if (await variant.count() > 0) {
  45  |       await variant.click();
  46  |       await page.waitForTimeout(1000);
  47  | 
  48  |       // Check for project selection buttons
  49  |       const projectButtons = await page.locator('button').filter({ hasText: /CCv5|NRv3|Spot/ });
  50  |       const count = await projectButtons.count();
  51  |       
  52  |       if (count > 0) {
  53  |         console.log(`✓ Found ${count} project buttons - widget is interactive`);
  54  |         
  55  |         // Test project selection
  56  |         await projectButtons.first().click();
  57  |         await page.waitForTimeout(500);
  58  |         
  59  |         // Check if AI brief updated
  60  |         const aiBrief = await page.textContent('div:has-text("AI")');
  61  |         console.log(`✓ AI brief displayed: ${aiBrief ? 'yes' : 'no'}`);
  62  |         
  63  |         await page.screenshot({ path: 'screenshots/widget-risk-stage-ai.png' });
  64  |         console.log('✓ Risk + Stage + AI variant rendered and interactive');
  65  |       } else {
  66  |         console.log('⚠ No project buttons found');
  67  |       }
  68  |     } else {
  69  |       console.log('⚠ Risk + Stage + AI button not found');
  70  |     }
  71  |   });
  72  | 
  73  |   test('Risk bars should be clickable and update insights', async ({ page }) => {
  74  |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  75  |     
  76  |     // Find Risk + Stage + AI Summary variant
  77  |     const variant = await page.locator('button:has-text("Risk + Stage + AI Summary")').first();
  78  |     if (await variant.count() > 0) {
  79  |       await variant.click();
  80  |       await page.waitForTimeout(1000);
  81  | 
  82  |       // Look for risk axis buttons
  83  |       const riskButtons = await page.locator('button').filter({ hasText: /Scope|Deadline|Resource|Deps/ });
  84  |       const count = await riskButtons.count();
  85  | 
  86  |       if (count > 0) {
  87  |         console.log(`✓ Found ${count} risk axis buttons`);
  88  |         
  89  |         // Click a risk axis
  90  |         await riskButtons.first().click();
  91  |         await page.waitForTimeout(500);
  92  | 
  93  |         // Check if insights updated
  94  |         const insights = await page.textContent('div');
  95  |         console.log(`✓ Risk selection triggered insights: ${insights?.length || 0} chars`);
  96  |         
  97  |         await page.screenshot({ path: 'screenshots/widget-risk-summary.png' });
  98  |         console.log('✓ Risk + Stage + AI Summary variant interactive');
  99  |       }
  100 |     }
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Responsive Design', () => {
  105 |   
  106 |   test('should render on desktop', async ({ page }) => {
  107 |     await page.setViewportSize({ width: 1920, height: 1080 });
  108 |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  109 |     await page.screenshot({ path: 'screenshots/desktop-view.png', fullPage: true });
  110 |     console.log('✓ Desktop view captured');
  111 |   });
  112 | 
  113 |   test('should render on tablet', async ({ page }) => {
  114 |     await page.setViewportSize({ width: 768, height: 1024 });
  115 |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  116 |     await page.screenshot({ path: 'screenshots/tablet-view.png', fullPage: true });
  117 |     console.log('✓ Tablet view captured');
  118 |   });
  119 | 
  120 |   test('should render on mobile', async ({ page }) => {
  121 |     await page.setViewportSize({ width: 375, height: 667 });
  122 |     await page.goto(`${BASE_URL}/test-layouts`, { waitUntil: 'networkidle' });
  123 |     await page.screenshot({ path: 'screenshots/mobile-view.png', fullPage: true });
  124 |     console.log('✓ Mobile view captured');
```