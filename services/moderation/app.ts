import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3010;

const app: Express = express();

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/status", (req, res) => {
    res.status(200).json({
        status: "up",
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});

app.listen(PORT, () => {
    console.log(`Moderation service is running on port ${PORT}`);
});
