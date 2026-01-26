import { Router } from "express";
import { AuthController } from "./auth.controller";
// import { verifyCsrfMiddleware } from "../../middlewares/csrfMiddleware";
const router = Router();
const ctrl = new AuthController();

router.post("/register", ctrl.register.bind(ctrl));
router.post("/login", ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));
router.post("/verify-email", ctrl.verifyEmail.bind(ctrl));
router.post("/resend-verification", ctrl.resendVerification.bind(ctrl));
router.post("/logout", ctrl.logout.bind(ctrl));

export { router as authRouter };
