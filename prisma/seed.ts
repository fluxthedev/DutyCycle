import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.dutyEvent.deleteMany(),
    prisma.dutyLog.deleteMany(),
    prisma.duty.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const defaultPassword = await bcrypt.hash('demo-password', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.local',
      name: 'Demo Admin',
      role: 'ADMIN',
      hashedPassword: defaultPassword,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@demo.local',
      name: 'Demo Manager',
      role: 'MANAGER',
      hashedPassword: defaultPassword,
    },
  });

  await prisma.user.create({
    data: {
      email: 'client@demo.local',
      name: 'Demo Client',
      role: 'CLIENT',
    },
  });

  const clients = await Promise.all(
    [
      { name: 'Acme Manufacturing', description: 'Primary production facility' },
      { name: 'Northside Clinic', description: 'Healthcare services branch' },
      { name: 'BrightFuture Schools', description: 'Education partner organization' },
    ].map((client) =>
      prisma.client.create({
        data: client,
      })
    )
  );

  const dutyTemplates = [
    {
      title: 'Inspect safety equipment',
      description: 'Verify that all safety equipment is present and operational.',
      frequency: 'WEEKLY',
    },
    {
      title: 'Clean common areas',
      description: 'Perform cleaning of lobbies and shared spaces.',
      frequency: 'DAILY',
    },
    {
      title: 'Backup critical systems',
      description: 'Run and verify nightly data backup procedures.',
      frequency: 'DAILY',
    },
    {
      title: 'Review incident reports',
      description: 'Analyze and summarize weekly incident reports.',
      frequency: 'WEEKLY',
    },
    {
      title: 'Monthly compliance audit',
      description: 'Complete regulatory compliance checklist.',
      frequency: 'MONTHLY',
    },
    {
      title: 'Inventory supplies',
      description: 'Check supply levels and reorder if necessary.',
      frequency: 'WEEKLY',
    },
    {
      title: 'Equipment calibration',
      description: 'Calibrate measurement devices according to schedule.',
      frequency: 'MONTHLY',
    },
    {
      title: 'Emergency drill coordination',
      description: 'Coordinate quarterly emergency response drill.',
      frequency: 'MONTHLY',
    },
    {
      title: 'Client satisfaction survey',
      description: 'Collect and review client feedback for the period.',
      frequency: 'MONTHLY',
    },
    {
      title: 'Policy review session',
      description: 'Review and update policy documentation.',
      frequency: 'ONCE',
    },
  ];

  const now = new Date();

  for (let i = 0; i < dutyTemplates.length; i++) {
    const template = dutyTemplates[i];
    const client = clients[i % clients.length];

    const duty = await prisma.duty.create({
      data: {
        title: template.title,
        description: template.description,
        frequency: template.frequency,
        status: (i % 3 === 0 ? 'IN_PROGRESS' : 'PENDING'),
        client: { connect: { id: client.id } },
        assignedTo: { connect: { id: manager.id } },
        events: {
          create: [
            {
              scheduledFor: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
              status: i % 4 === 0 ? 'COMPLETED' : 'PENDING',
              completedAt:
                i % 4 === 0 ? new Date(now.getTime() + i * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) : null,
              notes: i % 4 === 0 ? 'Completed as scheduled.' : null,
            },
          ],
        },
        logs: {
          create: [
            {
              action: 'DUTY_CREATED',
              details: `Duty created for ${client.name}`,
              actor: { connect: { id: admin.id } },
            },
            {
              action: 'DUTY_ASSIGNED',
              details: `Assigned to ${manager.name}`,
              actor: { connect: { id: manager.id } },
            },
          ],
        },
        notifications: {
          create: [
            {
              message: `New duty assigned: ${template.title}`,
              user: { connect: { id: manager.id } },
            },
          ],
        },
      },
    });

    if (i % 4 === 0) {
      await prisma.notification.create({
        data: {
          message: `Duty ${duty.title} completed successfully`,
          user: { connect: { id: admin.id } },
          duty: { connect: { id: duty.id } },
          readAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('Seed data created successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
