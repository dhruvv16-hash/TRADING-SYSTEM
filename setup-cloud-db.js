const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("\n=======================================================");
console.log("    STRATEGY-OS CLOUD DATABASE SETUP SCRIPT");
console.log("=======================================================\n");

console.log("Go to Supabase -> Connect -> URI and copy your connection string.");
console.log("It looks like: postgresql://postgres:[YOUR-PASSWORD]@aws-0-eu.pooler.supabase.com:6543/postgres");
console.log("\nCRITICAL: Make sure you replace [YOUR-PASSWORD] with your actual password BEFORE pasting it here!");
console.log("CRITICAL: Change the port from 6543 to 5432 BEFORE pasting it here!\n");

rl.question('Paste your Supabase URL here and press Enter: ', (url) => {
  if (!url.includes('postgres')) {
    console.log("\n[ERROR] That doesn't look like a valid PostgreSQL URL.");
    process.exit(1);
  }
  
  if (url.includes('[YOUR-PASSWORD]')) {
    console.log("\n[ERROR] You forgot to put your real password in the URL! It still says [YOUR-PASSWORD]. Try again.");
    process.exit(1);
  }

  if (url.includes('6543')) {
    console.log("\n[ERROR] You forgot to change the port 6543 to 5432! Try again.");
    process.exit(1);
  }

  console.log("\nConnecting to your Supabase Cloud Database and building tables...");
  
  try {
    // Run prisma db push using the provided URL
    execSync('npx prisma db push --accept-data-loss', { 
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'inherit' 
    });
    console.log("\n✅ SUCCESS! All tables have been built in your cloud database.");
    console.log("✅ Vercel will now work perfectly. You can close this terminal.\n");
  } catch (error) {
    console.log("\n❌ FAILED. The URL or password you provided was incorrect.");
  }
  
  process.exit(0);
});
