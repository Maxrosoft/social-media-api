import { Router } from "express";
import authController from "../controllers/authController";

const authRouter: Router = Router();

authRouter.post("/register", authController.register as any);
authRouter.get("/verify-email", authController.verifyEmail as any);
authRouter.post("/send-verification-email", authController.sendVerificationEmail as any);
authRouter.post("/login", authController.login as any);

export default authRouter;
