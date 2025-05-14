import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3008;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Search service is running on port ${PORT}`);
});
