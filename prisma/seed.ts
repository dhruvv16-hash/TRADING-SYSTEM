// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const testUsers = [
  { name: 'Alice Chen',  email: 'alice@strategyos.dev',  password: 'Test1234!' },
  { name: 'Bob Martin',  email: 'bob@strategyos.dev',    password: 'Test1234!' },
  { name: 'Carol Singh', email: 'carol@strategyos.dev',  password: 'Test1234!' },
  { name: 'David Kim',   email: 'david@strategyos.dev',  password: 'Test1234!' },
  { name: 'Eve Patel',   email: 'eve@strategyos.dev',    password: 'Test1234!' },
]

async function main() {
  console.log('Seeding database...')
  for (const u of testUsers) {
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: hash,
        emailVerified: new Date(),
      },
    })
    console.log(`  ✓ ${u.name} <${u.email}>`)
  }
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
