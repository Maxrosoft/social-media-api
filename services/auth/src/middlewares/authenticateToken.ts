import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import APIResponse from "../interfaces/APIResponse";

export default function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];

    console.log(accessToken);

    if (accessToken == null) {
        const response: APIResponse = {
            success: false,
            statusCode: 401,
            message: "Unauthorized",
        };
        return res.status(response.statusCode).send(response);
    }

    try {
        const decoded: JwtPayload = jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;
        (req as any).user.id = decoded.id;
        next();
    } catch(error) {
        next(error);
    }
}
