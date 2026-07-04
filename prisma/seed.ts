import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

// ---------- Import Plan JSON Files ----------

import plan50000 from './data/plans/50000.json';
import plan100000 from './data/plans/100000.json';
import plan200000 from './data/plans/200000.json';
import plan500000 from './data/plans/500000.json';

// ---------- Prisma Adapter ----------

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing.');
}

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

// ---------- Types ----------

type ScheduleRow = {
  installmentNumber: number;
  installmentAmount: number;
  withdrawalAmount: number;
};

type PlanSeed = {
  name: string;
  totalAmount: number;
  schedules: ScheduleRow[];
};

// ---------- Master Plan Data ----------

const plans: PlanSeed[] = [
  {
    name: '₹50,000 Plan',
    totalAmount: 50000,
    schedules: plan50000 as ScheduleRow[],
  },
  {
    name: '₹1,00,000 Plan',
    totalAmount: 100000,
    schedules: plan100000 as ScheduleRow[],
  },
  {
    name: '₹2,00,000 Plan',
    totalAmount: 200000,
    schedules: plan200000 as ScheduleRow[],
  },
  {
    name: '₹5,00,000 Plan',
    totalAmount: 500000,
    schedules: plan500000 as ScheduleRow[],
  },
];

// ---------- Helper ----------

function log(message: string) {
  console.log(`✅ ${message}`);
}

function section(title: string) {
  console.log('\n===================================');
  console.log(title);
  console.log('===================================\n');
}

// =====================================================
// Seed Super Admin
// =====================================================

async function seedAdmin() {
  section('Seeding Super Admin');

  const email = 'admin@smartchit.com';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    log(`Admin already exists (${email})`);
    return existingUser;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  log(`Admin created (${email})`);

  return admin;
}

// =====================================================
// Seed One Plan Template
// =====================================================

async function seedPlan(plan: PlanSeed) {
  console.log(`\n📌 ${plan.name}`);

  const planTemplate = await prisma.planTemplate.upsert({
    where: {
      name: plan.name,
    },

    update: {
      totalAmount: plan.totalAmount,
      installmentCount: 20,
      isActive: true,
    },

    create: {
      name: plan.name,
      totalAmount: plan.totalAmount,
      installmentCount: 20,
      isActive: true,
    },
  });

  log(`${plan.name} template ready.`);

  return planTemplate;
}

// =====================================================
// Seed Schedule Rows
// =====================================================

async function seedPlanSchedules(planTemplateId: string, schedules: ScheduleRow[]) {
  for (const row of schedules) {
    await prisma.planScheduleTemplate.upsert({
      where: {
        planTemplateId_installmentNumber: {
          planTemplateId,
          installmentNumber: row.installmentNumber,
        },
      },

      update: {
        installmentAmount: row.installmentAmount,
        withdrawalAmount: row.withdrawalAmount,
      },

      create: {
        planTemplateId,
        installmentNumber: row.installmentNumber,
        installmentAmount: row.installmentAmount,
        withdrawalAmount: row.withdrawalAmount,
      },
    });
  }

  log(`${schedules.length} schedule rows inserted.`);
}

// =====================================================
// Seed All Plans
// =====================================================

async function seedPlans() {
  section('Seeding Plan Templates');

  for (const plan of plans) {
    const template = await seedPlan(plan);

    await seedPlanSchedules(template.id, plan.schedules);
  }
}

// =====================================================
// Seed System Settings
// =====================================================

async function seedSystemSettings() {
  section('Seeding System Settings');

  const settings = [
    {
      key: 'company_name',
      value: 'Balaganesh Chit Agency',
      description: 'Company Name',
    },
    {
      key: 'company_phone',
      value: '9047251565',
      description: 'Company Contact Number',
    },
    {
      key: 'company_email',
      value: 'ganeshmoorthy7246@gmail.com',
      description: 'Company Email',
    },
    {
      key: 'default_installment_count',
      value: '20',
      description: 'Default Installment Count',
    },
    {
      key: 'receipt_prefix',
      value: 'RCT',
      description: 'Receipt Prefix',
    },
    {
      key: 'withdrawal_prefix',
      value: 'WDL',
      description: 'Withdrawal Prefix',
    },
    {
      key: 'enrollment_prefix',
      value: 'ENR',
      description: 'Enrollment Prefix',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: {
        key: setting.key,
      },
      update: {
        value: setting.value,
        description: setting.description,
      },
      create: setting,
    });
  }

  log('System settings seeded.');
}

// =====================================================
// Main
// =====================================================

async function main() {
  console.clear();

  console.log('======================================');
  console.log(' Smart Chit Management System');
  console.log(' Database Seeder');
  console.log('======================================\n');

  await prisma.$transaction(async () => {
    await seedAdmin();

    await seedPlans();

    await seedSystemSettings();
  });

  console.log('\n');
  console.log('======================================');
  console.log(' Database Seed Completed Successfully');
  console.log('======================================');
}

// =====================================================
// Execute
// =====================================================

main()
  .catch((error) => {
    console.error('\n❌ Seed Failed');
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();

    await pool.end();
  });
