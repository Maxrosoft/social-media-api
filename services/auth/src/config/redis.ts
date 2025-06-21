import { createClient } from "redis";

const authRedisClient = createClient({
    url: process.env.AUTH_REDIS_URL,
});

authRedisClient.connect();

const sessionRedisClient = createClient({
    url: process.env.SESSION_REDIS_URL,
});

sessionRedisClient.connect();

export { authRedisClient, sessionRedisClient };


