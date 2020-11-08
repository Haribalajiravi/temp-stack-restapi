import passport from 'passport';
import passportJwt, {
  ExtractJwt,
  VerifiedCallback,
} from 'passport-jwt';
const JwtStrategy = passportJwt.Strategy;
import passportLocal from 'passport-local';
const LocalStrategy = passportLocal.Strategy;
import GooglePlusTokenStrategy from 'passport-google-plus-token';
import User, { IUser } from './models/user';
import { Request } from 'express';
import { AuthenticationMethod } from './enums/common';
import dotEnv from 'dotenv';
dotEnv.config();

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'NDSfkdkDAFnl',
    },
    async (payload: any, done: VerifiedCallback) => {
      try {
        const user: IUser | null = await User.findById(payload.sub);
        if (!user) {
          return done(null, false);
        }
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
    },
    async (
      email: string,
      password: string,
      done: VerifiedCallback
    ) => {
      try {
        const user: IUser | null = await User.findOne({
          'local.email': email,
        });
        if (!user) {
          return done(null, false);
        }
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
          return done(null, false);
        }
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.use(
  'googleToken',
  new GooglePlusTokenStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      passReqToCallback: true,
    },
    async (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifiedCallback
    ) => {
      try {
        let existingUser: IUser | null = await User.findOne({
          'google.id': profile.id,
        });
        if (existingUser) {
          return done(null, existingUser);
        }

        existingUser = await User.findOne({
          'local.email': profile.emails[0].value,
        });
        if (existingUser) {
          existingUser.methods.push(AuthenticationMethod.GOOGLE);
          existingUser.google = {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            thumbImage:
              profile.photos && profile.photos.length !== 0
                ? profile.photos[0].value
                : undefined,
          };
          await existingUser.save();
          return done(null, existingUser);
        }
        const newUser: IUser = new User({
          methods: [AuthenticationMethod.GOOGLE],
          google: {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile.displayName,
            thumbImage:
              profile.photos && profile.photos.length !== 0
                ? profile.photos[0].value
                : undefined,
          },
        });
        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, false, error.message);
      }
    }
  )
);
