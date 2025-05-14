import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3010;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Moderation service is running on port ${PORT}`);
});
