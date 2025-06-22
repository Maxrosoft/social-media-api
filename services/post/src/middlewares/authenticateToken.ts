import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sessionRedisClient } from "../config/redis";

export default async function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return next();
    }

    try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET as string);

        if (!payload.jti) {
            return next();
        }

        const sessionKey = `session:${payload.jti}`;

        const sessionData = await sessionRedisClient.get(sessionKey);
        const sessionDataObject = JSON.parse(sessionData as string);
        if (!sessionData) {
            return next();
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