import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3005;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Feed service is running on port ${PORT}`);
});
