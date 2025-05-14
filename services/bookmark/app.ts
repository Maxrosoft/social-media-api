import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3009;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Bookmark service is running on port ${PORT}`);
});
