import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3011;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Analytics service is running on port ${PORT}`);
});
