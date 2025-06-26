import express, { Express } from "express";
import "dotenv/config";
import sequelize from "./config/sequelize";
import postsRouter from "./routes/postsRouter";
import errorHandler from "./middlewares/errorHandler";
import { initMinioBucket } from "./utils/initMinio";

const PORT = process.env.PORT || 3003;

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(postsRouter);

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
        await initMinioBucket(process.env.MINIO_BUCKET as string);
        console.log(`Bucket ${process.env.MINIO_BUCKET} initialized...`);
        app.listen(PORT, () => {
            console.log(`Post service is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Startup error:", error);
    }
})();

export default app;
