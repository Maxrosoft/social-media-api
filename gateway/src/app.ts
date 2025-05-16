import express, { Express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

const app: Express = express();

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/api/status", (req, res) => {
    res.status(200).json({
        status: "up",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

app.use("/api/auth", createProxyMiddleware({ target: "http://auth:3001", changeOrigin: true }));
app.use("/api/user", createProxyMiddleware({ target: "http://user:3002", changeOrigin: true }));
app.use("/api/post", createProxyMiddleware({ target: "http://post:3003", changeOrigin: true }));
app.use("/api/comment", createProxyMiddleware({ target: "http://comment:3004", changeOrigin: true }));
app.use("/api/feed", createProxyMiddleware({ target: "http://feed:3005", changeOrigin: true }));
app.use("/api/like", createProxyMiddleware({ target: "http://like:3006", changeOrigin: true }));
app.use("/api/notification", createProxyMiddleware({ target: "http://notification:3007", changeOrigin: true }));
app.use("/api/search", createProxyMiddleware({ target: "http://search:3008", changeOrigin: true }));
app.use("/api/bookmark", createProxyMiddleware({ target: "http://bookmark:3009", changeOrigin: true }));
app.use("/api/moderation", createProxyMiddleware({ target: "http://moderation:3010", changeOrigin: true }));
app.use("/api/analytics", createProxyMiddleware({ target: "http://analytics:3011", changeOrigin: true }));

app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});

export default app;
