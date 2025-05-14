import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3004;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Comment service is running on port ${PORT}`);
});
