import sequelize from "../config/sequelize";
import { DataTypes } from "sequelize";

const Block = sequelize.define(
    "Block",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        blockerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        blockedId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    { timestamps: true }
);

export default Block;
