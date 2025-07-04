import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sessionRedisClient } from "../config/redis";
import APIResponse from "../interfaces/APIResponse";

export default async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        const response: APIResponse = {
            success: false,
            statusCode: 401,
            message: "Unauthorized: No token provided",
        };
        return res.status(401).json(response);
    }

    try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (!payload.jti) {
            const response: APIResponse = {
                success: false,
                statusCode: 401,
                message: "Token is missing jti",
            };
            return res.status(401).json(response);
        }

        const sessionKey = `session:${payload.jti}`;

        const sessionData = await sessionRedisClient.get(sessionKey);
        const sessionDataObject = JSON.parse(sessionData as string);
        if (!sessionData) {
            const response: APIResponse = {
                success: false,
                statusCode: 401,
                message: "Session not found or expired",
            };
            return res.status(401).json(response);
        }

        (req as any).user = {
            id: sessionDataObject.userId,
            role: sessionDataObject.role,
            email: sessionDataObject.email,
            username: sessionDataObject.username,
            createdAt: sessionDataObject.createdAt,
            lastActivity: sessionDataObject.lastActivity,
        };

        (req as any).session = { jti: payload.jti };

        next();
    } catch (error) {
        next(error);
    }
}
