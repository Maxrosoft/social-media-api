import User from "./User";
import Follow from "./Follow";
import Block from "./Block";
import FollowRequest from "./FollowRequest";

// User associations

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

// Follow associations

Follow.belongsTo(User, {
    foreignKey: "followerId",
    as: "follower",
});

Follow.belongsTo(User, {
    foreignKey: "followingId",
    as: "followingUser",
});

// FollowRequest associations

FollowRequest.belongsTo(User, {
    foreignKey: "requesterId",
    as: "requester",
});

FollowRequest.belongsTo(User, {
    foreignKey: "requestedId",
    as: "requested",
});

// Block associations

Block.belongsTo(User, {
    foreignKey: "blockerId",
    as: "blocker",
});

Block.belongsTo(User, {
    foreignKey: "blockedId",
    as: "blockedUser",
});

export { User, Follow, FollowRequest, Block };