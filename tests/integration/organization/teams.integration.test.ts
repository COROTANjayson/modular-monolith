
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

            expect(res.body.success).toBe(true);
            expect(res.body.code).toBe('TEAM_CREATED');
            expect(res.body.data.name).toBe('Alpha Team');
            expect(res.body.data.leaderId).toBe(user.id);
            
            const dbTeam = await prisma.team.findUnique({ where: { id: res.body.data.id } });
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

            const res = await request(app)
                .post(`/api/v1/organizations/${org.id}/teams`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Beta Team' })
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.code).toBe('TEAM_CREATED');
        });

        it('should allow Team Lead to create a team', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
               data: {
                   name: 'Org 3', slug: 'org-3', ownerId: 'some-other-id',
                   members: { create: { userId: user.id, role: 'team_lead' as OrganizationRole, status: 'active' } }
               }
           });

           const res = await request(app)
               .post(`/api/v1/organizations/${org.id}/teams`)
               .set('Authorization', `Bearer ${accessToken}`)
               .send({ name: 'Charlie Team' })
               .expect(201);

           expect(res.body.success).toBe(true);
           expect(res.body.code).toBe('TEAM_CREATED');
        });

        it('should NOT allow Member to create a team', async () => {
            const { accessToken, user } = await createAuthenticatedUser();
            const org = await prisma.organization.create({
               data: {
                   name: 'Org 4', slug: 'org-4', ownerId: 'some-other-id',
                   members: { create: { userId: user.id, role: 'member', status: 'active' } }
               }
           });

           const res = await request(app)
               .post(`/api/v1/organizations/${org.id}/teams`)
               .set('Authorization', `Bearer ${accessToken}`)
               .send({ name: 'Delta Team' })
               .expect(403);

           expect(res.body.success).toBe(false);
           expect(res.body.code).toBe('ERROR_FORBIDDEN');
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

            expect(res.body.success).toBe(true);
            expect(res.body.code).toBe('TEAMS_FETCHED');
            expect(res.body.data).toHaveLength(2);
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
             const successRes = await request(app)
                .patch(`/api/v1/organizations/${org.id}/teams/${team.id}`)
                .set('Authorization', `Bearer ${userA.accessToken}`)
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(successRes.body.success).toBe(true);
            expect(successRes.body.code).toBe('TEAM_UPDATED');
            expect(successRes.body.data.name).toBe('Updated Name');

            // User B (Admin but not leader) updates -> Fail with 403
            const failRes = await request(app)
                .patch(`/api/v1/organizations/${org.id}/teams/${team.id}`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .send({ name: 'Hacked Name' })
                .expect(403);

            expect(failRes.body.success).toBe(false);
            expect(failRes.body.code).toBe('ERROR_FORBIDDEN');
        });

        it('should get list of teams user belongs to (mine)', async () => {
             const userA = await createAuthenticatedUser();
             const userB = await createAuthenticatedUser();
             
             const org = await prisma.organization.create({
                 data: {
                     name: 'Org Teams List', slug: 'org-teams-list', ownerId: userA.user.id,
                     members: { create: { userId: userA.user.id, role: 'owner', status: 'active' } }
                 }
             });

             // Team 1: User A is leader (member implicitly)
             await prisma.team.create({
                 data: { organizationId: org.id, name: 'Team Alpha', leaderId: userA.user.id, members: { create: { userId: userA.user.id } } }
             });

             // Team 2: User A is member, User B is leader
             await prisma.team.create({
                 data: { organizationId: org.id, name: 'Team Beta', leaderId: userB.user.id, members: { create: { userId: userA.user.id } } }
             });

             // Team 3: User A is NOT member, User B is leader
             await prisma.team.create({
                 data: { organizationId: org.id, name: 'Team Gamma', leaderId: userB.user.id }
             });

             const res = await request(app)
                .get(`/api/v1/organizations/${org.id}/teams/mine`)
                .set('Authorization', `Bearer ${userA.accessToken}`)
                .expect(200);

             expect(res.body.success).toBe(true);
             expect(res.body.code).toBe('MY_TEAMS_FETCHED');
             expect(res.body.data).toHaveLength(2);
             const teamNames = res.body.data.map((t: any) => t.name);
             expect(teamNames).toContain('Team Alpha');
             expect(teamNames).toContain('Team Beta');
             expect(teamNames).not.toContain('Team Gamma');
        });
    });
});
