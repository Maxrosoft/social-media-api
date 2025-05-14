import express, { Express } from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3003;

const app: Express = express();

app.listen(PORT, () => {
    console.log(`Post service is running on port ${PORT}`);
});
