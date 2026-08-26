const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const strategies = await prisma.strategy.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (strategies.length > 0) {
    const strategy = strategies[0];
    console.log('ID:', strategy.id);
    console.log('Name:', strategy.name);
    console.log('Language:', strategy.language);
    console.log('Code Length:', strategy.code.length, 'characters');
    console.log('--- Code Preview ---');
    console.log(strategy.code.split('\n').slice(0, 10).join('\n'));
    console.log('...');
  } else {
    console.log('No strategies found');
  }
}
main().finally(() => prisma.$disconnect());

