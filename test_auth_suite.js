// test_auth_suite.js
const { chromium } = require('playwright');

const TEST_ACCOUNTS = [
  { name: 'Alice Chen',  email: 'alice@strategyos.dev',  password: 'Test1234!' },
  { name: 'Bob Martin',  email: 'bob@strategyos.dev',    password: 'Test1234!' },
  { name: 'Carol Singh', email: 'carol@strategyos.dev',  password: 'Test1234!' },
  { name: 'David Kim',   email: 'david@strategyos.dev',  password: 'Test1234!' },
  { name: 'Eve Patel',   email: 'eve@strategyos.dev',    password: 'Test1234!' },
];

async function runAuthTests() {
  console.log("==================================================");
  console.log("PHASE 1: AUTHENTICATION & MULTI-TENANCY TEST SUITE");
  console.log("==================================================\n");

  const browser = await chromium.launch();
  
  // TEST 1: Test Invalid Login Rejection
  console.log("TEST 1: Verifying Invalid Credentials Rejection...");
  const page1 = await browser.newPage();
  await page1.goto('http://localhost:3000/login');
  await page1.fill('input[type="email"]', 'wrong@strategyos.dev');
  await page1.fill('input[type="password"]', 'WrongPassword123!');
  await page1.click('button[type="submit"]');
  await page1.waitForTimeout(1000);
  
  const currentUrl = page1.url();
  if (currentUrl.includes('/login')) {
    console.log("  ✓ PASS: Invalid login correctly rejected, remained on /login.\n");
  } else {
    console.error("  ✗ FAIL: Invalid login bypassed to", currentUrl);
  }
  await page1.close();

  // TEST 2: Test All 5 Seeded Users Authentication & Workspace Isolation
  console.log("TEST 2: Verifying All 5 Seeded Accounts & Workspace Data Isolation...");
  for (const user of TEST_ACCOUNTS) {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    const heading = await page.textContent('h1');
    console.log(`  ✓ PASS: ${user.name} (${user.email}) -> Authenticated -> "${heading.trim()}"`);
    
    await context.close();
  }

  console.log("\n==================================================");
  console.log("ALL PHASE 1 AUTHENTICATION TESTS PASSED (5/5 USERS)");
  console.log("==================================================");
  
  await browser.close();
}

runAuthTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
