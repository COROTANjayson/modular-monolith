import { EmailService as ExistingEmailService } from "../../../shared/utils/email.service";
import { IEmailService } from "../application/ports";

export class EmailServiceAdapter implements IEmailService {
  private emailService = new ExistingEmailService();

  async sendVerificationEmail(
    email: string,
    verificationLink: string,
  ): Promise<void> {
    await this.emailService.queueEmail({
      to: email,
      subject: "Verify your email",
      template: "verification-email",
      variables: {
        verificationLink,
        currentYear: new Date().getFullYear(),
        appName: "Your App",
      },
    });
  }
}
