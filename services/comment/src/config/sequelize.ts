import { Sequelize } from "sequelize";
import "dotenv/config";

const POSTGRES_URI = process.env.POSTGRES_URI as string;

const sequelize = new Sequelize(POSTGRES_URI, {
    dialect: "postgres",
    logging: false,
});

export default sequelize; 