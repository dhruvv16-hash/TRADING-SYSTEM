require('dotenv').config({path: '.env.local'});
require('tsx/cjs');
const { runOptimizationSweep } = require('./src/app/(app)/strategies/optimizeActions.ts');
async function test() {
  try {
    const res = await runOptimizationSweep('cmt7npvao000050c28ja7hvj3');
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
}
test().finally(() => process.exit(0));
