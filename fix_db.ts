import { prisma } from './src/lib/db'
async function main() {
  await prisma.strategy.updateMany({ where: { id: 'cmt7npvao000050c28ja7hvj3', phase: 'backtest' }, data: { phase: 'data' } });
  console.log('Fixed DB');
}
main().finally(() => process.exit(0));

