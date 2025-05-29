import { Router } from "express";
import authController from "../controllers/authController";

const authRouter: Router = Router();

authRouter.post("/register", authController.register as any);

export default authRouter;
