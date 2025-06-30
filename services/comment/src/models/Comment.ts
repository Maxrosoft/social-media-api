import sequelize from "../config/sequelize";
import { DataTypes } from "sequelize";

const Comment = sequelize.define(
    "Comment",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        postId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        parentCommentId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        likeCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    },
    { timestamps: true }
);

export default Comment; 