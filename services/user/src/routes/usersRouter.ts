import { Router } from "express";
import usersController from "../controllers/usersController";
import authenticateToken from "../middlewares/authenticateToken";
import multer from "multer";

const usersRouter: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

usersRouter.get("/me", authenticateToken as any, usersController.getMe as any);
usersRouter.get("/:id", authenticateToken as any, usersController.getUserById as any);
usersRouter.post("/avatar", authenticateToken as any, upload.single("avatar"), usersController.setAvatar as any);
usersRouter.post("/:id/follow", authenticateToken as any, usersController.follow as any);
usersRouter.post("/:id/accept-follow-request", authenticateToken as any, usersController.acceptFollowRequest as any);
usersRouter.post("/:id/reject-follow-request", authenticateToken as any, usersController.rejectFollowRequest as any);
usersRouter.post("/:id/unfollow", authenticateToken as any, usersController.unfollow as any);
usersRouter.get("/:id/followers", authenticateToken as any, usersController.getFollowers as any);
usersRouter.get("/:id/following", authenticateToken as any, usersController.getFollowing as any);
usersRouter.get("/:id/follow-requests", authenticateToken as any, usersController.getFollowRequests as any);
usersRouter.post("/:id/block", authenticateToken as any, usersController.block as any);
usersRouter.post("/:id/unblock", authenticateToken as any, usersController.unblock as any);
usersRouter.get("/me/blocks", authenticateToken as any, usersController.getBlockedUsers as any);

export default usersRouter;
