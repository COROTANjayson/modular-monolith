import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password123', 10);
  
  // 1. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashed,
      age: 30
    }
  });
  
  const aliceUser = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: hashed,
      age: 28
    }
  });
  
  const charlieUser = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@example.com',
      password: hashed,
      age: 32
    }
  });

  const bobUser = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob@example.com',
      password: hashed,
      age: 35
    }
  });

  const davidUser = await prisma.user.upsert({
    where: { email: 'david@example.com' },
    update: {},
    create: {
      firstName: 'David',
      lastName: 'White',
      email: 'david@example.com',
      password: hashed,
      age: 25
    }
  });

  console.log('Seeded users:', adminUser.email, aliceUser.email, charlieUser.email, bobUser.email, davidUser.email);

  // 2. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      ownerId: adminUser.id
    }
  });

  console.log('Seeded organization:', org.name);

  // 2.5 Create Default Roles
  const ownerRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'owner' } },
    update: {},
    create: { organizationId: org.id, name: 'owner', permissions: [], isDefault: true }
  });
  
  const adminRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'admin' } },
    update: {},
    create: { organizationId: org.id, name: 'admin', permissions: [], isDefault: true }
  });
  
  const teamLeadRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'team_lead' } },
    update: {},
    create: { organizationId: org.id, name: 'team_lead', permissions: [], isDefault: true }
  });
  
  const memberRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'member' } },
    update: {},
    create: { organizationId: org.id, name: 'member', permissions: [], isDefault: true }
  });

  console.log('Seeded default roles for:', org.name);

  // 3. Create Organization Members
  const roles = [
    { user: adminUser, roleId: ownerRole.id },
    { user: aliceUser, roleId: adminRole.id },
    { user: charlieUser, roleId: teamLeadRole.id },
    { user: bobUser, roleId: memberRole.id },
    { user: davidUser, roleId: memberRole.id }
  ];

  for (const { user, roleId } of roles) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId: roleId,
        status: 'active',
        joinedAt: new Date()
      }
    });
  }

  console.log('Seeded organization members for:', org.name);

  // 4. Create Team
  const team = await prisma.team.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'Alpha Team'
      }
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Alpha Team',
      description: 'The primary team',
      leaderId: charlieUser.id
    }
  });

  console.log('Seeded team:', team.name);

  // 5. Create Team Members
  const teamMembers = [adminUser, aliceUser, charlieUser, bobUser, davidUser];
  
  for (const user of teamMembers) {
    await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id
        }
      },
      update: {},
      create: {
        teamId: team.id,
        userId: user.id,
        joinedAt: new Date()
      }
    });
  }

  console.log('Seeded team members for:', team.name);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
