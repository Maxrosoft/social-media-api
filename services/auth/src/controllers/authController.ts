import { Request, Response, NextFunction } from "express";
import APIResponse from "../interfaces/APIResponse";
import User from "../models/User";
import passwordValidationSchema from "../utils/passwordValidationSchema";
import bcrypt from "bcrypt";

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
}

export default new AuthController();
