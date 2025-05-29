import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import User from "../models/User";
import passwordValidationSchema from "../utils/passwordValidationSchema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Mailer from "../utils/mailer";
import { Op } from "sequelize";

async function hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(password, salt);
    return hashedPassword;
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
            const token = req.query.token as string;

            // Check if the token is valid
            const user: any = await User.findOne({
                where: {
                    verificationToken: token,
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

    async sendVerificationEmail(req: Request, res: Response, next: NextFunction) {
        try {
            // Destructure the request body
            const { email } = req.body;

            // Check if the user exists
            const user: any = await User.findOne({
                where: {
                    email,
                },
            });
            if (!user) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 404,
                    message: "User does not exist.",
                };
                return res.status(response.statusCode).json(response);
            }

            // Check if the user is already verified
            if (user.isVerified) {
                const response: APIResponse = {
                    success: false,
                    statusCode: 400,
                    message: "User is already verified.",
                };
                return res.status(response.statusCode).json(response);
            }

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
                statusCode: 200,
                message: "Verification email sent successfully!",
            };
            return res.status(response.statusCode).json(response);
        } catch (error) {
            next(error);
        }
    }

    // async login(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         // Destructure the request body
    //         const { email, password } = req.body;
    //     } catch (error) {
    //         next(error);
    //     }
}

export default new AuthController();
