import { NextFunction, Request, Response } from "express";
import APIResponse from "../interfaces/APIResponse";

export default function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const response: APIResponse = {
        success: false,
        statusCode: 500,
        message: err.message,
    };

    res.status(response.statusCode).json(response);
} 