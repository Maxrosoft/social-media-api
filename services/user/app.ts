import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3002;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`User service is running on port ${PORT}`);
});
