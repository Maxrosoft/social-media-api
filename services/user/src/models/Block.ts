import sequelize from "../config/sequelize";
import { DataTypes, ENUM } from "sequelize";
import User from "./User";

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

Block.belongsTo(User, {
    foreignKey: "blockerId",
    as: "blocker",
});

Block.belongsTo(User, {
    foreignKey: "blockedId",
    as: "blockedUser",
});

export default Block;
