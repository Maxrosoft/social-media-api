import { createClient } from "redis";

const sessionRedisClient = createClient({
    url: process.env.SESSION_REDIS_URL,
});

sessionRedisClient.connect();

export { sessionRedisClient }; 