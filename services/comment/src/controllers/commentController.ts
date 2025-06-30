import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import Comment from "../models/Comment";
import axios from "axios";

class CommentController {
    async addComment(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const postId = req.params.id;
            const { content, parentCommentId } = req.body;
            const accessToken = req.headers.authorization?.split(" ")[1];

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the content is present
            if (!content) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Content is required.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the post exists
            const axiosResponsePostData: any = await axios.get(`${process.env.POST_SERVICE_URL}/${postId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const post = axiosResponsePostData.data.data.post;
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found or you don't have access to it.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the parent comment id is present
            if (parentCommentId) {
                // Check if the parent comment exists
                const parentComment: any = await Comment.findByPk(parentCommentId);
                if (!parentComment) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 404,
                        message: "Parent comment not found.",
                    };
                    return res.status(response.statusCode).json(response);
                }

                // Check if the parent comment belongs to the post
                if (parentComment.postId !== postId) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 400,
                        message: "Parent comment does not belong to the post.",
                    };
                    return res.status(response.statusCode).json(response);
                }
            }

            // Create the comment
            const comment = await Comment.create({
                content,
                authorId: sessionUser.id,
                postId,
                parentCommentId,
            });

            // Return the response
            const response: APIResponse = {
                success: true,
                statusCode: 201,
                message: "Comment created successfully.",
                data: { comment },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default new CommentController();
