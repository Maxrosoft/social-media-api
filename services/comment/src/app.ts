import express, { Express } from "express";
import "dotenv/config";
import errorHandler from "./middlewares/errorHandler";
import authenticateToken from "./middlewares/authenticateToken";
import commentRouter from "./routes/commentRouter";
import sequelize from "./config/sequelize";

const PORT = process.env.PORT || 3004;

const app: Express = express();

app.use(express.json());
app.use(authenticateToken);
app.use(commentRouter);

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
        app.listen(PORT, () => {
            console.log(`Comment service is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Startup error:", error);
    }
})();

export default app;