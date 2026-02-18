
import { Organization } from "./organization.entity";
import { User } from "../../user/domain/user.entity"; // Assuming User entity exists there, or I should check.
// Actually, looking at member.entity.ts, it defines user inline or doesn't import it full. 
// member.entity.ts has: user?: { id: string; firstName: string | null; ... }
// I will start with a cleaner definition.

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  leaderId: string;
  createdAt: Date;
  updatedAt: Date;
  leader?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
  _count?: {
      members: number;
  }
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: Date;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
}
