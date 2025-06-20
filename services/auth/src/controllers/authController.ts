import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import User from "../models/User";
import passwordValidationSchema from "../utils/passwordValidationSchema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Mailer from "../utils/Mailer";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import redisClient from "../config/redisClient";
import { publishUserCreatedEvent } from "../events/publisher";
import PublishedUser from "../interfaces/PublishedUser";

async function hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(password, salt);
    return hashedPassword;
}

function generateAccessToken(userId: string, role: string) {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, {
        expiresIn: "1d",
    });
}

const isEmail = new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);

function sanitizeUser(user: any): any {
    return {
        id: user.id,
        googleId: user.googleId,
        role: user.role,
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username,
        isVerified: user.isVerified,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { email, password, name, surname, username } = req.body;

            // Check if all required fields are present
            if (!email || !password || !name || !surname || !username) {
                const missingFields: string[] = [];
                if (!email) missingFields.push("email");
                if (!password) missingFields.push("password");
                if (!name) missingFields.push("name");
                if (!surname) missingFields.push("surname");
                if (!username) missingFields.push("username");
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: `Missing required fields: ${missingFields.join(", ")}`,
                };
                return res.status(response.statusCode).json(response);
            }

            // Validate password
            const passwordValidationDetails: any = passwordValidationSchema.validate(password, { details: true });
            if (passwordValidationDetails.length > 0) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: passwordValidationDetails.map((error: any) => error.message).join(", "),
                };
                return res.status(response.statusCode).json(response);
            }

            // Hash the password
            const passwordHash: string = await hashPassword(password);

            // Create the user
            await User.create({
                email,
                passwordHash,
                name,
                surname,
                username,
            });

            // Create the verification token
            const verificationToken: string = crypto.randomBytes(20).toString("hex");
            await User.update(
                {
                    verificationToken,
                    verificationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
                },
                {
                    where: {
                        email,
                    },
                }
            );

            // Send the verification email
            const mailer = new Mailer(email);
            await mailer.sendVerificationToken(verificationToken);

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 201,
                message: "Registration successful! Please verify your email to activate your account.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request params
            const verificationToken: string = req.query.verificationToken as string;

            // Check if the token is present
            if (!verificationToken) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Missing verification token.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the token is valid
            const user: any = await User.findOne({
                where: {
                    verificationToken,
                    verificationTokenExpiresAt: {
                        [Op.gt]: new Date(),
                    },
                },
            });

            // Send the response if the token is invalid
            if (!user) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Invalid or expired verification token.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Update the user if the token is valid
            await User.update(
                {
                    isVerified: true,
                    verificationToken: null,
                    verificationTokenExpiresAt: null,
                },
                {
                    where: {
                        email: user.email,
                    },
                }
            );

            // Publish the user created event
            const publishedUser: PublishedUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                username: user.username,
                isBanned: user.isBanned,
            };
            await publishUserCreatedEvent(publishedUser);

            // Send the response if the token is valid
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Email verified successfully!",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { email, password } = req.body;

            // Check if the required fields are present
            if (!email || !password) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Missing required fields.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user exists
            const user: any = await User.findOne({
                where: {
                    email,
                },
            });
            if (!user) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "Incorrect email or password.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is logged in with Google
            if (user.googleId) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "User is logged in with Google.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user has too many failed login attempts
            const failedLoginAttempts = await redisClient.get(`failedLoginAttempts:${user.id}`);
            if (failedLoginAttempts && parseInt(failedLoginAttempts) >= 5) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 429,
                    message: "Too many failed login attempts. Please try again later after 15 minutes.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is verified
            if (!user.isVerified) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "User is not verified.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is banned
            if (user.isBanned) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 403,
                    message: "User is banned.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the password is correct
            const isPasswordCorrect: boolean = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordCorrect) {
                // Update the failed login attempts
                if ((await redisClient.get(`failedLoginAttempts:${user.id}`)) === null) {
                    await redisClient.set(`failedLoginAttempts:${user.id}`, 1, {
                        EX: 15 * 60,
                    });
                } else {
                    await redisClient.incr(`failedLoginAttempts:${user.id}`);
                }

                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "Incorrect email or password.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if MFA is enabled
            if (user.mfaEnabled) {
                // Generate the MFA token
                const mfaToken: string = crypto.randomBytes(20).toString("hex");
                user.mfaToken = mfaToken;
                user.mfaTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
                await user.save();
                // Generate the MFA code
                const mfaFourDigitCode: string = Math.floor(1000 + Math.random() * 9000).toString();
                redisClient.set(`mfaCode:${user.id}`, mfaFourDigitCode, {
                    EX: 5 * 60,
                });

                // Send the MFA code
                const mailer = new Mailer(user.email);
                await mailer.sendMfaToken(mfaFourDigitCode);

                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "MFA is enabled. Please log in using MFA.",
                    data: { mfaRequired: true, mfaToken },
                };

                return res.status(response.statusCode).json(response);
            }

            // Reset the failed login attempts
            await redisClient.del(`failedLoginAttempts:${user.id}`);

            // Generate the access token
            const accessToken: string = generateAccessToken(user.id, user.role);

            // Set the access token in redis
            await redisClient.set(`jwt:${user.id}`, accessToken, {
                EX: 24 * 60 * 60,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Login successful!",
                data: {
                    accessToken,
                    user: sanitizeUser(user),
                },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async mfaLogin(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { mfaToken, mfaCode } = req.body;

            // Check if all required fields are present
            if (!mfaToken || !mfaCode) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Missing required fields.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if mfa token is valid
            const user: any = await User.findOne({
                where: {
                    mfaToken,
                    mfaTokenExpiresAt: {
                        [Op.gt]: new Date(),
                    },
                },
            });

            // Send the response if the token is invalid
            if (!user) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "Invalid MFA token.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if mfa code is valid
            const mfaCodeFromRedis: string | null = await redisClient.get(`mfaCode:${user.id}`);
            if (mfaCodeFromRedis !== mfaCode) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "Invalid MFA code.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Reset the mfa token
            user.mfaToken = null;
            user.mfaTokenExpiresAt = null;
            await user.save();

            // Generate the access token
            const accessToken: string = generateAccessToken(user.id, user.role);

            // Set the access token in redis
            await redisClient.set(`jwt:${user.id}`, accessToken, {
                EX: 24 * 60 * 60,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Login via MFA successful!",
                data: {
                    accessToken,
                    user: sanitizeUser(user),
                },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async passwordResetRequest(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { email } = req.body;

            // Check if the email is valid
            if (!email || !isEmail.test(email)) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Invalid email format.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Send the password reset email
            const user: any = await User.findOne({
                where: {
                    email,
                },
            });
            if (user) {
                const passwordResetToken: string = crypto.randomBytes(20).toString("hex");
                await redisClient.set(`passwordReset:${user.id}`, passwordResetToken, {
                    EX: 5 * 60,
                });
                const mailer = new Mailer(user.email);
                await mailer.sendPasswordResetEmail(passwordResetToken);
            }

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "If an account with that email exists, a password reset link has been sent.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async passwordResetConfirm(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { passwordResetToken, newPassword } = req.body;

            // Check if all required fields are present
            if (!passwordResetToken || !newPassword) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "Missing required fields.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if password reset token is valid
            const user: any = await User.findOne({
                where: {
                    id: req.user.id,
                },
            });
            const passwordResetTokenFromRedis: string | null = await redisClient.get(`passwordReset:${user.id}`);
            if (passwordResetTokenFromRedis !== passwordResetToken) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 401,
                    message: "Invalid or expired password reset token.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Hash the new password
            const hashedPassword: string = await hashPassword(newPassword);

            // Update the password
            user.password = hashedPassword;
            await user.save();

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Password updated successfully. You may now log in with the new password.",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    async googleCallback(req: any, res: Response, next: NextFunction) {
        try {
            // Destructure the request
            const user: any = req.user;

            // Publish the user created event
            const publishedUser: PublishedUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                username: user.username,
                isBanned: user.isBanned,
            };
            await publishUserCreatedEvent(publishedUser);

            // Generate the access token
            const accessToken: string = generateAccessToken(user.id, user.role);

            // Set the access token in redis
            await redisClient.set(`jwt:${user.id}`, accessToken, {
                EX: 24 * 60 * 60,
            });

            // Send the response
            const response: APIResponse = {
                success: true,
                statusCode: 200,
                message: "Login via Google successful!",
                data: {
                    accessToken,
                    user: sanitizeUser(user),
                },
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
