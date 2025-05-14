import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3007;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Notification service is running on port ${PORT}`);
});
