import User from "../models/User";
import PublishedUser from "../interfaces/PublishedUser";

export default async function createUserProfile(data: PublishedUser) {
    const { id, email, name, surname, username, isBanned} = data;
    await User.create({ id, email, name, surname, username, isBanned});
}
