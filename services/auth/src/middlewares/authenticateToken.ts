import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sessionRedisClient } from "../config/redis";
import APIResponse from "../interfaces/APIResponse";

export default async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            statusCode: 401,
            message: "Unauthorized: No token provided",
        });
    }

    try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (!payload.jti) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Token is missing jti",
            });
        }

        const sessionKey = `session:${payload.jti}`;

        const sessionData = await sessionRedisClient.get(sessionKey);
        const sessionDataObject = JSON.parse(sessionData as string);
        if (!sessionData) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: "Session not found or expired",
            });
        }

        (req as any).user = {
            id: sessionDataObject.userId,
            role: sessionDataObject.role,
            email: sessionDataObject.email,
            username: sessionDataObject.username,
            createdAt: sessionDataObject.createdAt,
            lastActivity: sessionDataObject.lastActivity,
        };

        next();
    } catch (error) {
        next(error);
    }
}
