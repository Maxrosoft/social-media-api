import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";
import { v4 as uuidv4 } from "uuid";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async function (accessToken, refreshToken, profile, done) {
            const profileData: any = profile;
            const email = profileData.emails[0].value;
            const googleId = profileData.id;
            const name = profileData.name.givenName;
            const surname = profileData.name.familyName;

            let user: any = await User.findOne({ where: { googleId } });

            if (!user) {
                user = await User.findOne({ where: { email } });

                if (user) {
                    user.googleId = googleId;
                    user.passwordHash = null;
                    user.firstLogin = false;
                    await user.save();
                } else {
                    const username = `google_${uuidv4().slice(0, 8)}`;

                    user = await User.create({
                        googleId,
                        email,
                        name,
                        surname,
                        username,
                        isVerified: true,
                        passwordHash: null,
                    });
                }
            } else {
                user.firstLogin = false;
                await user.save();
            }

            return done(null, user);
        }
    )
);
