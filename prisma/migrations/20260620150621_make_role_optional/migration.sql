-- DropForeignKey
ALTER TABLE "public"."OrganizationInvitation" DROP CONSTRAINT "OrganizationInvitation_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OrganizationMember" DROP CONSTRAINT "OrganizationMember_roleId_fkey";

-- AlterTable
ALTER TABLE "OrganizationInvitation" ALTER COLUMN "roleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationMember" ALTER COLUMN "roleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
