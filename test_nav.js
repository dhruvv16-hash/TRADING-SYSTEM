const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login first to ensure session
  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[type="email"]', 'bob@strategyos.dev');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard');
  console.log("Logged in successfully.");

  const links = await page.$$('aside nav a');
  console.log(`Found ${links.length} sidebar links.`);
  
  const results = {};

  for (const link of links) {
    const textContent = await link.textContent();
    const name = textContent.trim();
    
    // Skip locked links
    if (name.includes('LOCKED')) continue;
    
    const href = await link.getAttribute('href');
    console.log(`Testing link: ${name} (${href})`);
    
    const startTime = performance.now();
    
    // Click the link and wait for the page to navigate/render
    await Promise.all([
      page.waitForURL(`**${href}`),
      link.click()
    ]);
    
    // Wait for the main content to appear (Next.js route transition)
    await page.waitForSelector('main', { state: 'visible' });
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    results[name] = `${duration} ms`;
    
    console.log(`  -> ${duration} ms`);
    
    // Short pause before next click
    await page.waitForTimeout(500);
  }

  console.log("\n--- FINAL RESULTS ---");
  console.table(results);

  await browser.close();
})();
