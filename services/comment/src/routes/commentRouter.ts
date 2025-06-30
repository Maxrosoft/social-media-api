import { Router } from "express";
import commentController from "../controllers/commentController";

const commentRouter: Router = Router();

commentRouter.post("/post/:id", commentController.addComment as any);

export default commentRouter; 