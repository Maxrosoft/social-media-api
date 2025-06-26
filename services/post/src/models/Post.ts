import sequelize from "../config/sequelize";
import { DataTypes, ENUM } from "sequelize";

const Post = sequelize.define(
    "Post",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        media: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        visibility: {
            type: ENUM("public", "followers-only", "private"),
            allowNull: false,
            defaultValue: "public",
        },
        editedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        sharePostId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    { timestamps: true }
);

export default Post; 