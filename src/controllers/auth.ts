/*

 __      __                                         
 \ \    / /                                         
  \ \  / /__ _ __   ___  _ __ ___   ___  _   _ ___  
   \ \/ / _ \ '_ \ / _ \| '_ ` _ \ / _ \| | | / __| 
    \  /  __/ | | | (_) | | | | | | (_) | |_| \__ \ 
     \/ \___|_| |_|\___/|_| |_| |_|\___/ \__,_|___/ 
                                                    
* Author: BenziDev
* Website: https://venomous.gg
* Copyright (c) 2021 Venomous Technologies, Inc. All Rights Reserved.                                  
*/

// import thirdparty packages
import { Router } from 'express';
import Joi from 'joi';
import logger from 'jethro';
import argon2 from 'argon2';
import intformat from 'biguint-format';
import FlakeId from 'flake-idgen';
import Utils from '../utils';

// import models
import User from '../models/user';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';
import Channel from '../models/channel';

// import middleware
import { authenticate } from '../middleware';

export default () => {

  const api = Router();

  // register endpoint - POST "/v1/auth/register"
  api.post("/register", async (req, res) => {

    const {error} = registerSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const user = await User.findOne({"email":req.body.email});

      if (user) return res.status(400).json({"statusCode":400,"error":"Email already used"});

      const user2 = await User.findOne({"username":req.body.username});

      if (user2) return res.status(400).json({"statusCode":400,"error":"Username taken"});

      const hash = await argon2.hash(req.body.password, {type: argon2.argon2id, saltLength: 60});

      let flakeIdGen1 = new FlakeId({worker: 1});

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        id: intformat(flakeIdGen1.next(), 'dec'),
        hash
      });

      await newUser.save();

      await createChannel(newUser.id, newUser.username);

      const token = await Utils.generateToken();

      const newToken = new AuthToken({
        id: newUser.id,
        token,
        grant_type: "password"
      });

      await newToken.save();

      const refreshToken = await Utils.generateToken();

      const newRefreshToken = new RefreshToken({
        id: newUser.id,
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

  // login endpoint - POST "/v1/auth/login"
  api.post("/login", async (req, res) => {

    const {error} = loginSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const user = await User.findOne({email: req.body.email});

      if (!user) return res.status(400).json({"statusCode":400,"error":"Invalid email or password"});

      if (await argon2.verify(user.hash, req.body.password)) {
      
        const token = await Utils.generateToken();

        const newToken = new AuthToken({
          id: user.uid,
          token,
          grant_type: "password"
        });

        await newToken.save();

        const refreshToken = await Utils.generateToken();

        const newRefreshToken = new RefreshToken({
          id: user.uid,
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

  // refresh endpoint - POST "/v1/auth/refresh"
  api.post("/refresh", async (req, res) => {

    const {error} = refreshSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode": 400, "error": error.details[0].message});

    try {

      const token = await RefreshToken.findOne({token: req.body.refresh_token});

      if (!token) return res.status(400).json({"statusCode":400,"error":"Invalid token"});

      await RefreshToken.deleteOne({token: req.body.refresh_token});

      const token2 = await Utils.generateToken();

        const newToken = new AuthToken({
          id: token.uid,
          token: token2,
          grant_type: "password"
        });

        await newToken.save();

        const refreshToken = await Utils.generateToken();

        const newRefreshToken = new RefreshToken({
          id: token.uid,
          token: refreshToken,
          grant_type: "password"
        });

        await newRefreshToken.save();

        let dt = new Date();
        dt.setMinutes( dt.getMinutes() + 420 );

        return res.status(200).json({
          "statusCode": 200,
          "access_token": token2,
          "refresh_token": refreshToken,
          "token_type": "Bearer",
          "expires": dt.getTime()
        });

    } catch (err) {

      logger("debug", "Auth", err);
      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  });

  // logout endpoint - GET "/v1/auth/logout"
  api.get("/logout", authenticate, async (req:any, res) => {

    try {

      await AuthToken.deleteOne({token: req.token});

      res.status(200).json({"statusCode":200,"message":"Successfully Logged Out"});

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  });

  return api;

}

// create channnel object in db
const createChannel = async (id:string, username:string) => {
  
  try {

    const skey = await Utils.generateStreamKey();

    let flakeIdGen2 = new FlakeId({worker: 2});
    
    const newChannel = new Channel({
      id: intformat(flakeIdGen2.next(), 'dec'),
      name: username,
      owner: {
        username: username,
        id: id
      },
      stream_key: skey 
    });

    await newChannel.save();

    return true;

  } catch (err) {
    throw err;
  }

};

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

// refresh request validation schema
const refreshSchema = Joi.object({
  refresh_token: Joi.string().required()
});