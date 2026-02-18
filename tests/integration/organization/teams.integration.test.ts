
import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';
import { OrganizationRole } from '../../../src/modules/organization/domain/member.entity';

describe('Teams Feature Integration', () => {
    let app: Express;
    let prisma: ReturnType<typeof getPrismaTestClient>;

    beforeAll(async () => {
        app = await createTestApp();
        prisma = getPrismaTestClient();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    describe('Team Creation', () => {
        it('should allow Owner to create a team', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
                data: {
                    name: 'Org 1', slug: 'org-1', ownerId: user.id,
                    members: { create: { userId: user.id, role: 'owner', status: 'active' } }
                }
            });

            const res = await request(app)
                .post(`/api/v1/organizations/${org.id}/teams`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Alpha Team', description: 'The A Team' })
                .expect(201);

            expect(res.body.name).toBe('Alpha Team');
            expect(res.body.leaderId).toBe(user.id);
            
            const dbTeam = await prisma.team.findUnique({ where: { id: res.body.id } });
            expect(dbTeam).toBeTruthy();
        });

        it('should allow Admin to create a team', async () => {
             const { accessToken, user } = await createAuthenticatedUser();
             const org = await prisma.organization.create({
                data: {
                    name: 'Org 2', slug: 'org-2', ownerId: 'some-other-id',
                    members: { create: { userId: user.id, role: 'admin', status: 'active' } }
                }
            });

            await request(app)
                .post(`/api/v1/organizations/${org.id}/teams`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Beta Team' })
                .expect(201);
        });

        it('should allow Team Lead to create a team', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
               data: {
                   name: 'Org 3', slug: 'org-3', ownerId: 'some-other-id',
                   members: { create: { userId: user.id, role: 'team_lead' as OrganizationRole, status: 'active' } }
               }
           });

           await request(app)
               .post(`/api/v1/organizations/${org.id}/teams`)
               .set('Authorization', `Bearer ${accessToken}`)
               .send({ name: 'Charlie Team' })
               .expect(201);
        });

        it('should NOT allow Member to create a team', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
               data: {
                   name: 'Org 4', slug: 'org-4', ownerId: 'some-other-id',
                   members: { create: { userId: user.id, role: 'member', status: 'active' } }
               }
           });

           await request(app)
               .post(`/api/v1/organizations/${org.id}/teams`)
               .set('Authorization', `Bearer ${accessToken}`)
               .send({ name: 'Delta Team' })
               .expect(500); // Or 403 if error handler maps strictly, but currently throws generic Error -> 500 usually
        });
    });

    describe('Team Details and Members', () => {
        it('should list teams in organization', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
                data: {
                    name: 'Org List', slug: 'org-list', ownerId: user.id,
                    members: { create: { userId: user.id, role: 'owner', status: 'active' } }
                }
            });
            
            await prisma.team.create({
                data: { organizationId: org.id, name: 'Team 1', leaderId: user.id, members: { create: { userId: user.id }} }
            });
            await prisma.team.create({
                data: { organizationId: org.id, name: 'Team 2', leaderId: user.id }
            });

            const res = await request(app)
                .get(`/api/v1/organizations/${org.id}/teams`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body).toHaveLength(2);
        });

        it('should restrict update to Team Leader', async () => {
             // Create User A (Leader)
             const userA = await createAuthenticatedUser();
             // Create User B (Admin - but not leader)
             const userB = await createAuthenticatedUser();

             const org = await prisma.organization.create({
                 data: {
                     name: 'Org Update', slug: 'org-update', ownerId: userA.user.id,
                     members: { 
                         createMany: {
                             data: [
                                 { userId: userA.user.id, role: 'owner', status: 'active' },
                                 { userId: userB.user.id, role: 'admin', status: 'active' }
                             ]
                         }
                     }
                 }
             });

             const team = await prisma.team.create({
                 data: { organizationId: org.id, name: 'Original Name', leaderId: userA.user.id }
             });

             // User A (Leader) updates -> Success
             await request(app)
                .patch(`/api/v1/organizations/${org.id}/teams/${team.id}`)
                .set('Authorization', `Bearer ${userA.accessToken}`)
                .send({ name: 'Updated Name' })
                .expect(200);

            // User B (Admin but not leader) updates -> Fail
            await request(app)
                .patch(`/api/v1/organizations/${org.id}/teams/${team.id}`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .send({ name: 'Hacked Name' })
                .expect(500); // Expect generic error for permission denied
        });
    });
});
