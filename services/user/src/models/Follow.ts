import sequelize from "../config/sequelize";
import { DataTypes } from "sequelize";

const Follow = sequelize.define(
    "Follow",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        followerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        followingId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    { timestamps: true }
);

export default Follow;
