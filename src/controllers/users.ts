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
import { authenticate } from '../middleware';
import _ from 'lodash';
import Joi from 'joi';
import argon2 from 'argon2';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';
import Utils from '../utils';
import nodemailer from 'nodemailer';
import config from 'config';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// import models
import User from '../models/user';
import VerifyCode from '../models/verifycode';

export default () => {

  const api = Router();

  // get current users object endpoint - GET "/v1/users/@me"
  api.get("/@me", authenticate, async (req:any, res) => {

    try {

      const user = await User.findOne({id: req.id});

      if (req.grant_type == "password") {

        const data = _.pick(user, ["id", "email", "email_verifed", "username", "staff", "created", "username_time"]);

        res.status(200).json({"statusCode":200,"data": data});

      } else {

        if (!req.scope[0]) {

          let index = req.scope.length + 1;

          req.scope.forEach((scope:any, i:number) => {

            if (scope == "email") {

              nextFunc();

            } else if (index == i) {

              nextFunc2();

            }

          });

          const nextFunc = () => {

            const data = _.pick(user, ["id", "username", "email", "staff", "created"]);

            res.status(200).json({"statusCode":200,"data": data});

          }

          const nextFunc2 = () => {

            const data = _.pick(user, ["id", "username", "staff", "created"]);

            res.status(200).json({"statusCode":200,"data": data});

          }
      
        }

      }

    } catch (err) {
      res.status(500).json({"statusCode":500,"error":"Internal server error"});
    }

  });

  // edit username endpoint - PUT "/v1/users/@me/edit/username"
  api.put("/@me/edit/username", authenticate, async (req:any, res) => {

    if (req.grant_type == "password") {

      try {

        const {error} = editUsernameSchema.validate(req.body);

        if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

        const user = await User.findOne({id: req.id});

        if (await argon2.verify(user.hash, req.body.password)) {

          const user2 = await User.findOne({username: req.body.username});

          if (user2) return res.status(400).json({"statusCode":400,"error":"Username Taken"});

          const adjustTime = ((Date.now() - user.username_time) / 1000);

          console.log(adjustTime);

          if (adjustTime >= 0 || user.username_time == null) {

            let dt = new Date();
            dt.setMinutes( dt.getMinutes() + 43200 );

            user.username = req.body.username;

            user.username_time = dt.getTime();

            await user.save();

            res.status(200).json({"statusCode":200,"data":{"username": req.body.username}});

          } else {

            res.status(400).json({"statusCode":400,"error":"You're Changing Your Username Too Fast"});

          }

        } else {

          res.status(400).json({"statusCode":400,"error":"Invalid password"});

        }

      } catch (err) {

        console.log(err);

        res.status(500).json({"statusCode":500,"error":"Internal server error"});

      }

    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

    }

  });

  // change password endpoint - PUT "/v1/users/@me/edit/password"
  api.put("/@me/edit/password", authenticate, async (req:any, res) => {

    const {error} = editPasswordSchema.validate(req.body);
    
    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    if (req.grant_type == "password") {
      
      const user = await User.findOne({id:req.id});

      if (await argon2.verify(user.hash, req.body.current_password)) {

        const hash = await argon2.hash(req.body.new_password, {type:argon2.argon2id, saltLength: 60});

        user.hash = hash;

        await user.save();

        await AuthToken.deleteMany({id: req.id});

        await RefreshToken.deleteMany({id: req.id});

        const token = await Utils.generateToken();

        const newToken = new AuthToken({
          id: user.id,
          token,
          grant_type: "password"
        });

        await newToken.save();

        const refreshToken = await Utils.generateToken();

        const newRefreshToken = new RefreshToken({
          id: user.id,
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

        res.status(400).json({"statusCode":400,"error":"Invalid Password"});

      }

    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

    }

    try {

    } catch (err) {
      
      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

    }

  });

  // update email endpoint - PUT "/v1/users/@me/edit/email"
  api.put("/@me/edit/email", authenticate, async (req:any, res) => {

    if (req.grant_type == "password") {

      const {error} = updateEmailSchema.validate(req.body);

      if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

      try {

        const user = await User.findOne({email: req.body.new_email});

        if (user) return res.status(400).json({"statusCode":400,"error":"Email Already Used"});

        const user2 = await User.findOne({id: req.id});

        if (await argon2.verify(user2.hash, req.body.current_password)) {

          user2.email = req.body.new_email;

          user2.email_verified = false;

          await user2.save();

          const code = await Utils.generateVerifyCode();

          const newCode = new VerifyCode({
            code,
            id: user2.id
          });

          await newCode.save();

          res.status(200).json({"statusCode":200,"message":"Successfully changed email"});

          await sendEmail(code, req.body.new_email);

        } else {

          res.status(400).json({"statusCode":400,"error":"Invalid Password"});

        }

      } catch (err) {

        console.log(err);

        res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

      }

    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

    }

  });

  // generate 2fa secret endpoint - GET "/v1/users/@me/2fa/generate"
  api.get("/@me/2fa/generate", authenticate, async (req:any, res) => {

    if (req.grant_type == "password") {

      try {

        const secret:any = await speakeasy.generateSecret({length: 20, name: "venomous.gg"});
  
        await User.updateOne({id: req.id}, {two_factor_secret: secret.base32});
  
        const qr = await QRCode.toDataURL(secret.otpauth_url);
  
        res.status(200).json({'statusCode':200,"data":{"code": secret, "QR": qr}});
  
      } catch (err) {
  
        console.log(err);
  
        res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
  
      }

    } else {
      res.status(403).json({"statusCode":403,"error":"Forbidden"});
    }

  });

  // enable 2fa endpoint - PUT "/v1/users/@me/2fa/enable"
  api.put("/@me/2fa/enable", authenticate, async (req:any, res) => {

    if (req.grant_type == "password") {

      try {

        const user = await User.findOne({id: req.id});

        if (user.two_factor == true) return res.status(400).json({"statusCode": 400,"error": "2fa already enabled"});

        try {

          const verified = await speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: "base32",
            token: req.body.code,
            window: 0
          });

          if (!verified) return res.status(400).json({"statusCode":400,"error":"Invalid Code"});

          user.two_factor = true;

          await user.save();

          res.status(200).json({"statusCode":200,"message":"Successfully enabled 2fa"});

        } catch (err) {

          res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

        }

      } catch (err) {
        res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
      }

    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

    }

  });

  return api;

}

const sendEmail = async (code:string, email:string) => {
  
  let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: "no-reply@venomous.gg",
      pass: config.get("emailpass"),
    }
  });

  try {

    const info = await transporter.sendMail({
      from: `"Venomous" <no-reply@venomous.gg>`,
      to: email,
      subject: "Email Verifcation",
      text: code
    });

    return true;

  } catch (err) {

    try {

      const info = await transporter.sendMail({
        from: `"Venomous" <no-reply@venomous.gg>`,
        to: email,
        subject: "Email Verifcation",
        text: code
      });
  
      return true;

    } catch (err) {

      return false;

    }

  }

}

// edit username request schema
const editUsernameSchema = Joi.object({
  username: Joi.string().min(3).max(20).required().regex(/^[a-zA-Z0-9]+$/),
  password: Joi.string().required()
});

// edit password request schema
const editPasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(6).max(40).required() 
});

// update email request schema
const updateEmailSchema = Joi.object({
  current_password: Joi.string().required(),
  new_email: Joi.string().required().email()
});

// enable 2fa request schema
const enable2faSchema = Joi.object({
  code: Joi.string().required()
});