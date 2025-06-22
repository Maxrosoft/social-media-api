import express, { Express } from "express";
import "dotenv/config";
import sequelize from "./config/sequelize";
import { listenForUserEvents } from "./events/consumer";
import usersRouter from "./routes/usersRouter";
import errorHandler from "./middlewares/errorHandler";
import { initMinioBucket } from "./utils/initMinio";

const PORT = process.env.PORT || 3002;

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(usersRouter);

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

app.use(errorHandler);

(async () => {
    try {
        await sequelize.sync({ force: false });
        console.log(`Connection with ${process.env.POSTGRES_DB} has been established successfully.`);
        await listenForUserEvents();
        console.log("Listening for user events...");
        await initMinioBucket(process.env.MINIO_BUCKET as string);
        console.log(`Bucket ${process.env.MINIO_BUCKET} initialized...`);
        app.listen(PORT, () => console.log(`User service is running on port ${PORT}`));
    } catch (error) {
        console.error("Startup error:", error);
    }
})();

export default app;
