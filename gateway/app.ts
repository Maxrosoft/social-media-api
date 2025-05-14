import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});
