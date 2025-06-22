import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import Post from "../models/Post";

class PostsController {
    async createPost(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const { content, visibility } = req.body;
            const sessionUser = req.user;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if all required fields are present
            if (!content || !visibility) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Missing required fields.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Create the post
            const post = await Post.create({
                content,
                visibility,
                authorId: sessionUser.id,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 201,
                message: "Post created successfully.",
                data: { post },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default new PostsController();
