/**
 * Interface Layer - Notification Event Listeners
 */

import { NotificationService } from "../application/notification.service";
import { eventBus } from "../../../shared/infra/event-bus";
import { logger } from "../../../shared/infra/logger";

export function registerNotificationListeners(
  notificationService: NotificationService,
): void {
  eventBus.on("member.invited", async (payload) => {
    try {
      // Only create in-app notification if the user exists in our system
      if (payload.targetUserId) {
        await notificationService.create({
          userId: payload.targetUserId,
          type: "MEMBER_INVITE",
          title: "Organization Invitation",
          message: `You have been invited to join ${payload.organizationName} as ${payload.role}`,
          redirectUrl: payload.inviteUrl,
          metadata: {
            organizationId: payload.organizationId,
            organizationName: payload.organizationName,
            role: payload.role,
            email: payload.email,
            inviterId: payload.inviterId,
            token: payload.token,
          },
        });
      }
    } catch (err) {
      logger.error(
        "Failed to handle member.invited event in notification module",
        err,
      );
    }
  });

  logger.info("✓ Notification listeners registered");
}
