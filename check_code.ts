import { prisma } from './src/lib/db'
async function main() {
  const strategies = await prisma.strategy.findMany({ orderBy: { updatedAt: 'desc' } });
  if (strategies.length > 0) {
    console.log('LANGUAGE:', strategies[0].language);
    console.log('CODE:\n', strategies[0].code);
  } else {
    console.log('No strategies found');
  }
}
main().finally(() => process.exit(0));

