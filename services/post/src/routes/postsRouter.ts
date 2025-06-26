import { Router } from "express";
import postsController from "../controllers/postsController";
import authenticateToken from "../middlewares/authenticateToken";
import multer from "multer";

const postsRouter: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

postsRouter.post("/", authenticateToken as any, postsController.createPost as any);
postsRouter.patch("/:id", authenticateToken as any, postsController.editPost as any);
postsRouter.delete("/:id", authenticateToken as any, postsController.deletePost as any);
postsRouter.get("/:id", authenticateToken as any, postsController.getPostById as any);
postsRouter.post("/:id/media", authenticateToken as any, upload.single("media"), postsController.uploadMedia as any);
postsRouter.post("/:id/share", authenticateToken as any, postsController.sharePost as any);
postsRouter.get("/user/:id/public", postsController.getPublicPostsByUser as any);
postsRouter.get("/user/:id/all", authenticateToken as any, postsController.getAllPostsByUser as any);

export default postsRouter;
