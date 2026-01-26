import fs from "fs";
import path from "path";
import mjml2html from "mjml";
import { logger } from "../libs/logger";

// Cache compiled templates for performance
const templateCache = new Map<string, string>();

/**
 * Render an email template with variables
 * @param templateName - Name of the template file (without .mjml extension)
 * @param variables - Object containing template variables to replace
 * @returns Compiled HTML string
 */
export function renderEmailTemplate(
  templateName: string,
  variables: Record<string, any>
): { html: string; text: string } {
  const cacheKey = `${templateName}-${JSON.stringify(variables)}`;

  // Check cache first
  if (templateCache.has(cacheKey)) {
    const html = templateCache.get(cacheKey)!;
    return { html, text: generateTextVersion(html) };
  }

  // Read MJML template
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "emails",
    `${templateName}.mjml`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  let mjmlContent = fs.readFileSync(templatePath, "utf-8");

  // Replace template variables
  // Supports {{variableName}} syntax
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    mjmlContent = mjmlContent.replace(regex, String(value));
  });

  // Compile MJML to HTML
  const { html, errors } = mjml2html(mjmlContent, {
    validationLevel: "soft",
  });

  if (errors && errors.length > 0) {
    logger.warn("MJML compilation warnings:", errors);
  }

  // Cache the compiled template
  templateCache.set(cacheKey, html);

  return { html, text: generateTextVersion(html) };
}

/**
 * Generate a simple text version from HTML
 * Strips HTML tags for plain text email clients
 */
function generateTextVersion(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Clear template cache (useful for development/testing)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  logger.info("Email template cache cleared");
}
