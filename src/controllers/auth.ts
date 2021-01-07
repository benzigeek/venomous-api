import { Router } from 'express';
import Joi from 'joi';
import logger from 'jethro';
import argon2 from 'argon2';
import intformat from 'biguint-format';
import FlakeId from 'flake-idgen';
import User from '../models/user';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';
import { authenticate } from '../middleware';
import Utils from '../utils';

export default () => {

  const api = Router();

  api.post("/register", async (req, res) => {

    const {error} = registerSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const user = await User.findOne({"email":req.body.email});

      if (user) return res.status(400).json({"statusCode":400,"error":"Email already used"});

      const user2 = await User.findOne({"username":req.body.username});

      if (user2) return res.status(400).json({"statusCode":400,"error":"Username taken"});

      const hash = await argon2.hash(req.body.password, {type: argon2.argon2id, saltLength: 60});

      let flakeIdGen1 = new FlakeId();

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        uid: intformat(flakeIdGen1.next(), 'dec'),
        hash
      });

      await newUser.save();

      const token = await Utils.generateToken();

      const newToken = new AuthToken({
        uid: newUser.uid,
        token,
        grant_type: "password"
      });

      await newToken.save();

      const refreshToken = await Utils.generateToken();

      const newRefreshToken = new RefreshToken({
        uid: newUser.uid,
        token: refreshToken,
        grant_type: "password"
      });

      await newRefreshToken.save();

      var dt = new Date();
      dt.setMinutes( dt.getMinutes() + 420 );

      return res.status(200).json({
        "statusCode": 200,
        "access_token": token,
        "refresh_token": refreshToken,
        "token_type": "Bearer",
        "expires": dt.getTime()
      });

    } catch (err) {
      logger("error", "Mongo Database", err);
    }

  });

  api.post("/login", async (req, res) => {

    const {error} = loginSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const user = await User.findOne({email: req.body.email});

      if (!user) return res.status(400).json({"statusCode":400,"error":"Invalid email or password"});

      if (await argon2.verify(user.hash, req.body.password)) {
      
        const token = await Utils.generateToken();

        const newToken = new AuthToken({
          uid: user.uid,
          token,
          grant_type: "password"
        });

        await newToken.save();

        const refreshToken = await Utils.generateToken();

        const newRefreshToken = new RefreshToken({
          uid: user.uid,
          token: refreshToken,
          grant_type: "password"
        });

        await newRefreshToken.save();

        let dt = new Date();
        dt.setMinutes( dt.getMinutes() + 420 );

        return res.status(200).json({
          "statusCode": 200,
          "access_token": token,
          "refresh_token": refreshToken,
          "token_type": "Bearer",
          "expires": dt.getTime()
        });

      } else {
      
        return res.status(400).json({"statusCode":400,"error":"Invalid email or password"});

      }

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  });

  api.get("/logout", authenticate, async (req:any, res) => {

    try {

      await AuthToken.deleteMany({uid: req.uid, grant_type: "password"});

      await RefreshToken.deleteMany({uid: req.uid, grant_type: "password"});

      res.status(200).json({"statusCode":200,"message":"Successfully Logged Out"});

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  });

  return api;

}

// register request validation schema
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required().regex(/^[a-zA-Z0-9]+$/),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(40).required()
});

// login request validation schema
const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
});