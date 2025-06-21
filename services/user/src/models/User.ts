import sequelize from "../config/sequelize";
import { DataTypes, ENUM } from "sequelize";
import Follow from "./Follow";
import Block from "./Block";

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        role: {
            type: ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user",
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        surname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        bio: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isBanned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    { timestamps: true }
);

User.hasMany(Follow, {
    foreignKey: "followerId",
    as: "following",
});

User.hasMany(Follow, {
    foreignKey: "followingId",
    as: "followers",
});

User.hasMany(Block, {
    foreignKey: "blockerId",
    as: "blocks",
});

User.hasMany(Block, {
    foreignKey: "blockedId",
    as: "blockedBy",
});

export default User;
