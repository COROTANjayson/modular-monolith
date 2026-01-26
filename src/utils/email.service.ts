import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_SENDER_EMAIL, CLIENT_URL } from "./config";
import { queueEmail as addEmailToQueue, EmailJob } from "../queues/email.queue";
import { renderEmailTemplate } from "./email-renderer";
import { logger } from "../libs/logger";

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (RESEND_API_KEY) {
      this.resend = new Resend(RESEND_API_KEY);
      logger.info("Resend Initialized");
    } else {
      logger.warn(
        "Resend credentials not found. Email sending will be simulated."
      );
    }
  }

  /**
   * Send email directly using template
   */
  async sendEmail(emailData: EmailJob): Promise<any> {
    const { to, subject, template, variables, from } = emailData;

    // Render email template
    const { html, text } = renderEmailTemplate(template, variables);

    const sender = from || RESEND_SENDER_EMAIL || "onboarding@resend.dev";

    if (!this.resend) {
      logger.info("Simulating Email Send:", {
        to,
        subject,
        template,
        from: sender,
      });
      return { success: true, message: "Simulated" };
    }

    try {
      const data = await this.resend.emails.send({
        from: sender,
        to: typeof to === "string" ? to : to,
        subject: subject,
        html: html,
        text: text,
      });

      if (data.error) {
        logger.error("Resend Error:", data.error);
        throw data.error;
      }

      logger.info("Email sent:", data);
      return data;
    } catch (error) {
      logger.error("Email sending failed:", error);
      throw error;
    }
  }

  /**
   * Queue email for asynchronous processing
   */
  async queueEmail(emailData: EmailJob): Promise<void> {
    try {
      await addEmailToQueue(emailData);
    } catch (error) {
      logger.error("Failed to queue email:", error);
      logger.info("Falling back to direct email sending...");
      await this.sendEmail(emailData);
    }
  }
}
