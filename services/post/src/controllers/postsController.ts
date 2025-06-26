import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import Post from "../models/Post";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import minioClient from "../config/minio";

class PostsController {
    async createPost(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const { content, visibility } = req.body;
            const sessionUser = req.user;
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

            // Check if the user is private and the visibility is public
            const axiosResponseUserData: any = await axios.get(`${process.env.USER_SERVICE_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (axiosResponseUserData.data.data.user.isPrivate && (!visibility || visibility === "public")) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You cannot post publicly to a private user.",
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

    async editPost(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const { content, visibility } = req.body;
            const postId = req.params.id;
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

            // Check if the content or visibility is present
            if (!content && !visibility) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Content or visibility is required.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the post exists
            const post: any = await Post.findByPk(postId);
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is the owner of the post
            if (post.authorId !== sessionUser.id) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "You are not the owner of this post.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Update the post
            if (content) {
                post.content = content;
            }
            if (visibility) {
                post.visibility = visibility;
            }
            post.editedAt = new Date();
            await post.save();

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Post updated successfully.",
                data: { post },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async deletePost(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const postId = req.params.id;
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

            // Check if the post exists
            const post: any = await Post.findByPk(postId);
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is the owner of the post or an admin
            if (post.authorId !== sessionUser.id && sessionUser.role !== "admin") {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "You are not the owner of this post or an admin.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Delete the post
            await post.destroy();

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Post deleted successfully.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getPostById(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const postId = req.params.id;
            const sessionUser = req.user;
            const accessToken = req.headers.authorization?.split(" ")[1];

            // Check if the post exists
            const post: any = await Post.findByPk(postId);
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found.",
                };
                return res.status(response.statusCode).json(response);
            }

            if (post.visibility === "public") {
                const response: APIResponse = {
                    success: true,
                    statusCode: 200,
                    message: "Post retrieved successfully.",
                    data: { post },
                };
                return res.status(response.statusCode).json(response);
            } else if (post.visibility === "followers-only") {
                // Check if the user is logged in
                if (!sessionUser) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 401,
                        message: "You must be logged in to view this post.",
                    };
                    return res.status(response.statusCode).json(response);
                }

                // Check if the user is following the post author
                const axiosResponseIsFollowingData: any = await axios.get(
                    `${process.env.USER_SERVICE_URL}/${sessionUser.id}/following`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (
                    axiosResponseIsFollowingData.data.data.following.some(
                        (follow: any) => follow.followingId === post.authorId
                    )
                ) {
                    const response: APIResponse = {
                        success: true,
                        statusCode: 200,
                        message: "Post retrieved successfully.",
                        data: { post },
                    };
                    return res.status(response.statusCode).json(response);
                } else {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 403,
                        message: "You are not following the post author.",
                    };
                    return res.status(response.statusCode).json(response);
                }
            } else {
                // Check if the user is logged in
                if (!sessionUser) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 401,
                        message: "You must be logged in to view this post.",
                    };
                    return res.status(response.statusCode).json(response);
                }

                // Check if the user is the post author
                if (post.authorId === sessionUser.id) {
                    const response: APIResponse = {
                        success: true,
                        statusCode: 200,
                        message: "Post retrieved successfully.",
                        data: { post },
                    };
                    return res.status(response.statusCode).json(response);
                } else {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 403,
                        message: "You are not the post author.",
                    };
                    return res.status(response.statusCode).json(response);
                }
            }
        } catch (error) {
            next(error);
        }
    }

    async uploadMedia(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const file = req.file;
            const postId = req.params.id;

            // Check if the post exists
            const post: any = await Post.findOne({ where: { id: postId, authorId: sessionUser.id } });
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if file exists
            if (!file) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "No file uploaded.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if file is too big
            if (file.size > 10 * 1024 * 1024) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "The file is too big.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Generate the file name
            const fileExt = file.originalname.split(".").pop();
            const fileName = `media-${sessionUser.id}-${uuidv4()}.${fileExt}`;

            // Upload the file into minio
            await minioClient.putObject(process.env.MINIO_BUCKET!, fileName, file.buffer, file.size, {
                "Content-Type": file.mimetype,
            });

            // Generate the url
            const url = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET}/${fileName}`;

            // Update the post with the new media
            post.mediaUrl = url;
            await post.save();

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Media uploaded successfully.",
                data: { url },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async sharePost(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const postId = req.params.id;
            const sessionUser = req.user;
            const visibility = req.body.visibility;

            // Check if the post exists
            const post: any = await Post.findByPk(postId);
            if (!post) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Post not found.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the visibility is public
            if (post.visibility !== "public") {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "You can only share public posts.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Create the shared post
            const sharedPost: any = await Post.create({
                authorId: sessionUser.id,
                content: post.content,
                media: post.media,
                visibility: visibility || "public",
                sharePostId: postId,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Post shared successfully.",
                data: { sharedPost },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getPublicPostsByUser(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const userId = req.params.id;
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
            const offset = (page - 1) * limit;

            // Get the posts by user
            const posts: any = await Post.findAll({
                where: { authorId: userId, visibility: "public" },
                offset,
                limit,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Posts retrieved successfully.",
                data: { posts },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getAllPostsByUser(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const userId = req.params.id;
            const sessionUser = req.user;
            const accessToken = req.headers.authorization?.split(" ")[1];
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
            const offset = (page - 1) * limit;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Set the permitted visibilities
            const permittedVisibilities = ["public"];

            // Get the posts by user
            const posts: any = await Post.findAll({
                where: { authorId: userId },
                offset,
                limit,
            });

            // Check if the session user is following the author
            const axiosResponseIsFollowingData: any = await axios.get(
                `${process.env.USER_SERVICE_URL}/${sessionUser.id}/following`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (
                axiosResponseIsFollowingData.data.data.following.some(
                    (follow: any) => follow.followingId === userId
                )
            ) {
                permittedVisibilities.push("followers-only");
            } else if (sessionUser.id === userId) {
                permittedVisibilities.push("followers-only", "private");
            }

            // Filter the posts
            const filteredPosts = posts.filter((post: any) => {
                return permittedVisibilities.includes(post.visibility);
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Posts retrieved successfully.",
                data: { posts: filteredPosts },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default new PostsController();
