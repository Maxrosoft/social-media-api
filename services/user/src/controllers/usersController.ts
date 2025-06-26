import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import { User, Follow, FollowRequest, Block } from "../models/associations";
import { v4 as uuidv4 } from "uuid";
import minioClient from "../config/minio";

class UsersController {
    async getMe(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;

            // Check if the user exists in the request
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the user from the database
            const userId = sessionUser.id;
            const userFromDB = await User.findByPk(userId);

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Your data retrieved successfully.",
                data: { user: userFromDB },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const userId = req.params.id;
            const sessionUser = req.user;

            // Get the user from the database
            const userFromDB: any = await User.findByPk(userId);

            // Check if the user exists
            if (!userFromDB) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is private
            if (userFromDB.isPrivate) {
                // Check if the user is logged in
                if (!sessionUser) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 401,
                        message:
                            "The user account is private and requires authentication to determine whether you are subscribed to this user or not.",
                    };
                    return res.status(response.statusCode).json(response);
                }

                // Check if the user is a follower
                const isFollower = await Follow.findOne({
                    where: {
                        followerId: sessionUser.id,
                        followingId: userId,
                    },
                });
                if (!isFollower) {
                    const response: APIResponse = {
                        success: false,
                        statusCode: 403,
                        message: "You are not allowed to view this user's profile because you are not a follower.",
                    };
                    return res.status(response.statusCode).json(response);
                }
            }

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "User data retrieved successfully.",
                data: { user: userFromDB },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async setAvatar(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const file = req.file;

            // Check if file exists
            if (!file) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "No file uploaded.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Generate the file name
            const fileExt = file.originalname.split(".").pop();
            const fileName = `avatar-${sessionUser.id}-${uuidv4()}.${fileExt}`;

            // Upload the file into minio
            await minioClient.putObject(process.env.MINIO_BUCKET!, fileName, file.buffer, file.size, {
                "Content-Type": file.mimetype,
            });

            // Generate the url
            const url = `${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${process.env.MINIO_BUCKET}/${fileName}`;

            // Update the user with the new avatar
            await User.update(
                {
                    avatarUrl: url,
                },
                {
                    where: {
                        id: sessionUser.id,
                    },
                }
            );

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Avatar updated successfully.",
                data: { avatarUrl: url },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async follow(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is trying to follow themselves
            if (sessionUser.id === userId) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You cannot follow yourself.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the user from the database
            const userFromDB: any = await User.findByPk(userId);

            // Check if the user exists
            if (!userFromDB) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is already a follower
            const isFollower = await Follow.findOne({
                where: {
                    followerId: sessionUser.id,
                    followingId: userId,
                },
            });
            if (isFollower) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You are already a follower of this user.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is already a follow request
            const isFollowRequest = await FollowRequest.findOne({
                where: {
                    requesterId: sessionUser.id,
                    requestedId: userId,
                },
            });
            if (isFollowRequest) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You have already sent a follow request to this user.",
                };
            }

            // Check if the user is blocked
            const isBlocked = await Block.findOne({
                where: {
                    blockerId: sessionUser.id,
                    blockedId: userId,
                },
            });
            if (isBlocked) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You have blocked this user.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user has blocked the session user
            const isBlockedByUser = await Block.findOne({
                where: {
                    blockerId: userId,
                    blockedId: sessionUser.id,
                },
            });
            if (isBlockedByUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "This user has blocked you.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is private
            if (userFromDB.isPrivate) {
                await FollowRequest.create({
                    requesterId: sessionUser.id,
                    requestedId: userId,
                });
                const response: APIResponse = {
                    success: true,
                    statusCode: 200,
                    message: "Follow request sent successfully.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Add the follower
            await Follow.create({
                followerId: sessionUser.id,
                followingId: userId,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "You are now a follower of this user.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async acceptFollowRequest(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the follow request from the database
            const followRequest: any = await FollowRequest.findOne({
                where: {
                    requestedId: sessionUser.id,
                    requesterId: userId,
                },
            });

            // Check if the follow request exists
            if (!followRequest) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Follow request not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Add the follower
            await Follow.create({
                followerId: userId,
                followingId: sessionUser.id,
            });

            // Delete the follow request
            await FollowRequest.destroy({
                where: {
                    id: followRequest.id,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Follow request accepted successfully.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async rejectFollowRequest(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the follow request from the database
            const followRequest: any = await FollowRequest.findOne({
                where: {
                    requestedId: sessionUser.id,
                    requesterId: userId,
                },
            });

            // Check if the follow request exists
            if (!followRequest) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "Follow request not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Delete the follow request
            await FollowRequest.destroy({
                where: {
                    id: followRequest.id,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Follow request rejected successfully.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async unfollow(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the user from the database
            const userFromDB: any = await User.findByPk(userId);

            // Check if the user exists
            if (!userFromDB) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is a follower
            const isFollower = await Follow.findOne({
                where: {
                    followerId: sessionUser.id,
                    followingId: userId,
                },
            });
            if (!isFollower) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You are not a follower of this user.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Delete the follow
            await Follow.destroy({
                where: {
                    followerId: sessionUser.id,
                    followingId: userId,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "You are no longer a follower of this user.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFollowers(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const userId = req.params.id;

            // Get the followers
            const followers = await Follow.findAll({
                where: {
                    followingId: userId,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Followers retrieved successfully.",
                data: { followers },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFollowing(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const userId = req.params.id;

            // Get the following
            const following = await Follow.findAll({
                where: {
                    followerId: userId,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Following retrieved successfully.",
                data: { following },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getFollowRequests(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;

            // Get the follow requests
            const followRequests = await FollowRequest.findAll({
                where: {
                    requestedId: sessionUser.id,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Follow requests retrieved successfully.",
                data: { followRequests },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async block(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is trying to block themselves
            if (sessionUser.id === userId) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You cannot block yourself.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the user from the database
            const userFromDB: any = await User.findByPk(userId);

            // Check if the user exists
            if (!userFromDB) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is already blocked
            const isBlocked = await Block.findOne({
                where: {
                    blockerId: sessionUser.id,
                    blockedId: userId,
                },
            });
            if (isBlocked) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You have already blocked this user.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Block the user
            await Block.create({
                blockerId: sessionUser.id,
                blockedId: userId,
            });

            // Delete the follow
            await Follow.destroy({
                where: {
                    followerId: sessionUser.id,
                    followingId: userId,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "You have successfully blocked this user.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async unblock(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const sessionUser = req.user;
            const userId = req.params.id;

            // Check if the user is logged in
            if (!sessionUser) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "You are not logged in.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Get the user from the database
            const userFromDB: any = await User.findByPk(userId);

            // Check if the user exists
            if (!userFromDB) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User not found in database.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is blocked
            const block = await Block.findOne({
                where: {
                    blockerId: sessionUser.id,
                    blockedId: userId,
                },
            });
            if (!block) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "You have not blocked this user.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Unblock the user
            await block.destroy();

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "You have successfully unblocked this user.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async getBlockedUsers(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
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

            // Get the blocked users
            const blockedUsers = await Block.findAll({
                where: {
                    blockerId: sessionUser.id,
                },
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Blocked users retrieved successfully.",
                data: { blockedUsers },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default new UsersController();
