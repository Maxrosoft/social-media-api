import { Router } from "express";
import authController from "../controllers/authController";
import authenticateToken from "../middlewares/authenticateToken";
import passport from "passport";

const authRouter: Router = Router();

authRouter.post("/register", authController.register as any);
authRouter.get("/verify-email", authController.verifyEmail as any);
authRouter.post("/login", authController.login as any);
authRouter.post("/mfa-verify", authController.mfaLogin as any);
authRouter.post("/password-reset/request", authenticateToken as any, authController.passwordResetRequest as any);
authRouter.post("/password-reset/confirm", authenticateToken as any, authController.passwordResetConfirm as any);
authRouter.get("/oauth/google",
    passport.authenticate("google", {
        scope: ["email", "profile"],
        session: false
    })
);

authRouter.get("/oauth/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/oauth/google"
    }),
    authController.googleCallback as any
);


export default authRouter;
