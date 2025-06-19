import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import "dotenv/config";
import APIResponse from "../interfaces/APIResponse";

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

await redisClient.connect();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    handler: (req, res) => {
        const response: APIResponse = {
            success: false,
            statusCode: 429,
            message: "Too many requests. Please try again later.",
        };
        try {
            res.status(response.statusCode).json(response);
        } catch (error) {
            console.error(error);
        }
    },
});

export default limiter;
