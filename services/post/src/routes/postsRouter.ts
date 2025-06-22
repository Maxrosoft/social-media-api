import { Router } from "express";
import postsController from "../controllers/postsController";
import authenticateToken from "../middlewares/authenticateToken";

const postsRouter: Router = Router();

postsRouter.post("/posts", authenticateToken as any, postsController.createPost as any);

export default postsRouter; 