import { Router } from 'express';
import Joi from 'joi';
import logger from 'jethro';
import argon2 from 'argon2';
import intformat from 'biguint-format';
import FlakeId from 'flake-idgen';
import User from '../models/user';
import config from 'config';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';
import jwt from 'jsonwebtoken';

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

      const token = jwt.sign({
        uid: newUser.uid
      }, config.get("secret"), {
        expiresIn: 25200
      });

      const newAuthToken = new AuthToken({
        token 
      });

      await newAuthToken.save();

      const refresh = jwt.sign({
        uid: newUser.uid
      }, config.get("secret2"), {
        expiresIn: 31556952
      });

      const newRefresh = new RefreshToken({
        token: refresh
      });

      await newRefresh.save();

      var dt = new Date();
      dt.setMinutes( dt.getMinutes() + 420 );

      return res.status(200).json({
        "statusCode": 200,
        "auth_token": token,
        "refresh_token": refresh,
        "expires": dt.getTime()
      });

    } catch (err) {
      logger("error", "Mongo Database", err);
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