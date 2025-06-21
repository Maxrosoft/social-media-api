import sequelize from "../config/sequelize";
import { DataTypes, ENUM } from "sequelize";
import User from "./User";

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

Follow.belongsTo(User, {
    foreignKey: "followerId",
    as: "follower",
});

Follow.belongsTo(User, {
    foreignKey: "followingId",
    as: "followingUser",
});

export default Follow;
