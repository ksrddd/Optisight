import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@optisight2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@optisight.local' },
    update: {},
    create: {
      email: 'admin@optisight.local',
      name: 'Optisight Admin',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── Analyst User ────────────────────────────────────────────────────────────
  const analystPassword = await bcrypt.hash('Analyst@optisight2026', 12);
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@optisight.local' },
    update: {},
    create: {
      email: 'analyst@optisight.local',
      name: 'Security Analyst',
      password: analystPassword,
      role: 'analyst',
    },
  });
  console.log(`✅ Analyst user: ${analyst.email}`);

  // ─── Alert Events ────────────────────────────────────────────────────────────
  const alertCount = await prisma.alertEvent.count();
  if (alertCount === 0) {
    await prisma.alertEvent.createMany({
      data: [
        {
          title: 'Unusual Outbound Traffic',
          description: 'Detected unusual outbound traffic on Node 4 exceeding 500MB/s threshold.',
          severity: 'critical',
          source: 'Network Monitor',
          resolved: false,
        },
        {
          title: 'CPU Spike on Auth Server',
          description: 'Authentication server CPU usage spiked to 94% for over 3 minutes.',
          severity: 'warning',
          source: 'System Monitor',
          resolved: false,
        },
        {
          title: 'Unauthorized Access Attempt',
          description: 'Blocked brute-force login attempt from IP 45.33.32.156 (139 attempts).',
          severity: 'critical',
          source: 'Auth Service',
          resolved: true,
        },
        {
          title: 'API Rate Limit Exceeded',
          description: 'Client XYZ exceeded API rate limits — throttled for 15 minutes.',
          severity: 'warning',
          source: 'API Gateway',
          resolved: true,
        },
        {
          title: 'SSL Certificate Expiring Soon',
          description: 'SSL certificate for api.optisight.local expires in 14 days.',
          severity: 'info',
          source: 'Certificate Manager',
          resolved: false,
        },
      ],
    });
    console.log('✅ Alert events seeded.');
  } else {
    console.log(`ℹ️  Alert events already exist (${alertCount}), skipping.`);
  }

  // ─── Audit Logs ──────────────────────────────────────────────────────────────
  const logCount = await prisma.auditLog.count();
  if (logCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        { userId: admin.id, action: 'SYSTEM_INIT', details: 'System initialized and database seeded.', ipAddress: '127.0.0.1' },
        { userId: admin.id, action: 'LOGIN_SUCCESS', details: 'Admin account created during seed.', ipAddress: '127.0.0.1' },
      ],
    });
    console.log('✅ Audit logs seeded.');
  }

  console.log('\n🚀 Database seeding complete!');
  console.log('─────────────────────────────────────────');
  console.log('  Admin Login:   admin@optisight.local');
  console.log('  Password:      Admin@optisight2026');
  console.log('─────────────────────────────────────────');
  console.log('  Analyst Login: analyst@optisight.local');
  console.log('  Password:      Analyst@optisight2026');
  console.log('─────────────────────────────────────────');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
