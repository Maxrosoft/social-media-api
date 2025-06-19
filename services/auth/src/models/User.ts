import sequelize from "../config/sequelize";
import { DataTypes, ENUM } from "sequelize";

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
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
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
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        verificationTokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isBanned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        mfaEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        mfaToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mfaTokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    { timestamps: true }
);

export default User;
