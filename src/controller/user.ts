import JWT from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import User from './../models/user';
import { AuthenticationMethod } from './../enums/common';
import dotEnv from 'dotenv';
dotEnv.config();

const signToken = (user: any) => {
  return JWT.sign(
    {
      iss: 'NoteDown',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    process.env.JWT_SECRET || 'NDSfkdkDAFnl'
  );
};

export default {
  signUp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email: string = req.body.email;
      const password: string = req.body.password;
      let foundUser = await User.findOne({ 'local.email': email });
      if (foundUser) {
        return res
          .status(403)
          .json({ error: 'Email is already in use' });
      }
      foundUser = await User.findOne({
        $or: [{ 'google.email': email }],
      });
      if (foundUser) {
        foundUser.methods.push(AuthenticationMethod.LOCAL);
        foundUser.local.email = email;
        foundUser.local.password = password;
        await foundUser.save();
        const accessToken = signToken(foundUser);
        res.cookie('access_token', accessToken, {
          httpOnly: true,
        });
        res
          .status(200)
          .json({ success: true, access_token: accessToken });
      }
      const newUser = new User({
        methods: [AuthenticationMethod.LOCAL],
        local: {
          email,
          password,
        },
      });
      await newUser.save();
      const token = signToken(newUser);
      res.cookie('access_token', token, {
        httpOnly: true,
      });
      res.status(201).json({ success: true, access_token: token });
    } catch (error) {
      res.status(500).json({ success: false, error });
    }
  },
  signIn: async (req: Request, res: Response, next: NextFunction) => {
    const token = signToken(req.user);
    res.cookie('access_token', token, {
      httpOnly: true,
    });
    res.status(200).json({ success: true, access_token: token });
  },
  googleOAuth2: async (req: Request, res: Response) => {
    const token = signToken(req.user);
    res.cookie('access_token', token, {
      httpOnly: true,
    });
    res.status(200).json({ success: true, token });
  },
  signOut: async (req: Request, res: Response) => {
    res.clearCookie('access_token');
    res.json({ success: true });
  },
  profile: async (req: Request, res: Response) => {
    res.json({ success: true, profile: req.user });
  },
};
