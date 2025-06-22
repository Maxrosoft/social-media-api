import sequelize from "../config/sequelize";
import { DataTypes } from "sequelize";

const FollowRequest = sequelize.define(
    "FollowRequest",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requesterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        requestedId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    { timestamps: true }
);

export default FollowRequest;
