import { prisma } from './src/lib/db'
async function main() {
  const b = await prisma.backtest.findMany();
  console.log(b);
}
main().finally(() => process.exit(0));

