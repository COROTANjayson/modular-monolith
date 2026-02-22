
import { prisma } from "../../../shared/infra/prisma";
import { ITeamRepository } from "../domain/team.repository";
import { Team, TeamMember } from "../domain/team.entity";

export class PrismaTeamRepository implements ITeamRepository {
  async create(data: Omit<Team, "id" | "createdAt" | "updatedAt" | "leader" | "_count">): Promise<Team> {
    const { organizationId, name, description, leaderId } = data;
    const team = await prisma.team.create({
      data: {
        organizationId,
        name,
        description,
        leaderId,
        members: {
            create: {
                userId: leaderId
            }
        }
      },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    return team as unknown as Team;
  }

  async update(id: string, data: Partial<Omit<Team, "id" | "createdAt" | "updatedAt" | "leader" | "_count">>): Promise<Team> {
    const team = await prisma.team.update({
      where: { id },
      data,
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    return team as unknown as Team;
  }

  async findById(id: string): Promise<Team | null> {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });
    return team as unknown as Team | null;
  }

  async findByOrganizationId(organizationId: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: { organizationId },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return teams as unknown as Team[];
  }

  async addMember(teamId: string, userId: string): Promise<TeamMember> {
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
      },
      include: {
        user: {
           select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      }
    });
    return member as unknown as TeamMember;
  }

  async addMembers(teamId: string, userIds: string[]): Promise<TeamMember[]> {
    // Use a transaction: createMany then fetch with user includes
    const result = await prisma.$transaction(async (tx) => {
      await tx.teamMember.createMany({
        data: userIds.map((userId) => ({ teamId, userId })),
        skipDuplicates: true,
      });

      return tx.teamMember.findMany({
        where: {
          teamId,
          userId: { in: userIds },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
      });
    });

    return result as unknown as TeamMember[];
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });
  }

  async findMember(teamId: string, userId: string): Promise<TeamMember | null> {
    const member = await prisma.teamMember.findFirst({
        where: {
            teamId,
            userId
        },
        include: {
            user: {
               select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              }
            }
          }
    });
    return member as unknown as TeamMember | null;
  }

  async getMembers(teamId: string): Promise<TeamMember[]> {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
    return members as unknown as TeamMember[];
  }

  async isLeader(teamId: string, userId: string): Promise<boolean> {
      const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { leaderId: true }
      });
      return team?.leaderId === userId;
  }

  async findTeamsByMember(userId: string, organizationId: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: {
        organizationId,
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return teams as unknown as Team[];
  }
}
