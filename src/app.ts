import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "./shared/config/swagger.config";
import { createAuthModule } from "./modules/auth";
import { createUserModule } from "./modules/user";
import { createOrganizationModule } from "./modules/organization";
import { createNotificationModule } from "./modules/notification";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import {
  csrfTokenMiddleware,
  verifyCsrfMiddleware,
} from "./middlewares/csrfMiddleware";
import { logger } from "./shared/infra/logger";
import { CLIENT_URL } from "./shared/utils/config";
import { configurePassport } from "./shared/infra/passport";
// import csrf from 'csurf';
// https://chatgpt.com/c/68eb9870-0f28-8321-89fb-b3f88308208d <- csrf
const app = express();

app.use(
  cors({
    origin: CLIENT_URL|| "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  },
);

app.use(morganMiddleware);

// Default: 100 requests per 15 minutes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Swagger API Documentation
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Modular Monolith API - Documentation",
}));

// 🔹 Generate token automatically on first visit
app.use(csrfTokenMiddleware);
// 🔹 Verify token on state-changing methods
// app.use(verifyCsrfMiddleware);

// 🔹 Public route (just to get CSRF token)
app.get("/csrf-token", (req, res) => {
  res.json({ message: "CSRF token set in cookie" });
});

// Initialize Passport
configurePassport(app);

// Initialize auth module
const { router: authRouter } = createAuthModule();
app.use("/api/v1/auth", authRouter);

const { router: userRouter } = createUserModule();
app.use("/api/v1/users", userRouter);

const { router: orgRouter } = createOrganizationModule();
app.use("/api/v1/organizations", orgRouter);

const { router: notificationRouter, notificationGateway } =
  createNotificationModule();
app.use("/api/v1/notifications", notificationRouter);

// Export gateway for server.ts to initialize after Socket.IO is ready
export { notificationGateway };

// Auto-issue CSRF token cookie if missing
app.use(csrfTokenMiddleware);

app.get("/", (_req, res) =>
  res.json({ ok: true, message: "Express TypeScript Domain Backend" }),
);

export default app;
