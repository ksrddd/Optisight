import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@optisight.local' },
    update: {},
    create: {
      email: 'admin@optisight.local',
      name: 'Optisight Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  
  console.log('Seed successful: admin user created.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
