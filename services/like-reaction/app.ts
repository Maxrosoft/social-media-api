import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3006;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Like & Reaction service is running on port ${PORT}`);
});
