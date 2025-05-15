import express, { Express } from "express";
import sequelize from "./config/sequelize";
import "dotenv/config";

const PORT = process.env.PORT || 3001;

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

(async () => {
    try {
        await sequelize.sync();
        console.log(`Connection with ${process.env.POSTGRES_DB} has been established successfully.`);
        console.log(`Auth service is running on port ${PORT}`);
    } catch (error) {
        console.error(`Unable to connect to ${process.env.POSTGRES_DB}:`, error);
    }
})();
