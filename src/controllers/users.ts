/*

 __      __                                         
 \ \    / /                                         
  \ \  / /__ _ __   ___  _ __ ___   ___  _   _ ___  
   \ \/ / _ \ '_ \ / _ \| '_ ` _ \ / _ \| | | / __| 
    \  /  __/ | | | (_) | | | | | | (_) | |_| \__ \ 
     \/ \___|_| |_|\___/|_| |_| |_|\___/ \__,_|___/ 
                                                    
* Author: benzigeek
* Repo: github.com/benzigeek/venomous-api
* Copyright (c) 2021 Jordan (benzigeek)
*/

// import thirdparty packages
import express from 'express';
import { authenticate } from '../middleware';
import _ from 'lodash';
import Joi from 'joi';
import argon2 from 'argon2';
import Utils from '../utils';
import nodemailer from 'nodemailer';
import config from 'config';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import twilio, { twiml } from 'twilio';
import otpGen from 'otp-generator';

// import models
import User from '../models/user';
import VerifyCode from '../models/verifycode';
import RecoveryCode from '../models/recoverycode';
import OTP from '../models/otp';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';

// import types
import { IReq } from '../types';

const twiCli = twilio(config.get("twilio.sid"), config.get("twilio.token"));

export default () => {

  const api = express.Router();

  // get current users object endpoint - GET "/v1/users/@me"
  api.get("/@me", authenticate, async (req:IReq, res:express.Response) => {

    try {

      const user = await User.findOne({_id: req.id});

      if (req.grant_type == "password") {

        console.log(user);

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
  api.put("/@me/edit/username", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      try {

        const {error} = editUsernameSchema.validate(req.body);

        if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

        const user = await User.findOne({_id: req.id});

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
  api.put("/@me/edit/password", authenticate, async (req:IReq, res:express.Response) => {

    const {error} = editPasswordSchema.validate(req.body);
    
    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    if (req.grant_type == "password") {
      
      const user = await User.findOne({_id:req.id});

      if (await argon2.verify(user.hash, req.body.current_password)) {

        const verify = speakeasy.totp.verify({
          secret: user.two_factor_secret,
          encoding: "base32",
          token: req.body.code
        });

        if (!verify) return res.status(400).json({"statusCode":400,"error":"Invalid Code"});

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

  });

  // add/update phone number - PUT "/v1/users/@me/edit/phone"
  api.put("/@me/edit/phone", authenticate, async (req:IReq, res:express.Response) => {

    const {error} = editPhoneNumberSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode": 400, "error": error.details[0].message});

    try {

      if (req.grant_type == "password") {

        const code = await OTP.findOne({id: req.id, otp: req.body.code});

        if (!code) return res.status(400).json({"statusCode":400,"error":"Invalid Code"});

        await User.updateOne({_id: req.id, phone_number: code.phone_number});
        
        await OTP.deleteOne({id: req.id, code: req.body.code});
  
        res.status(200).json({"statusCode": 200,"message": "Successfully Added Phone Number"});

      } else {

        res.status(403).json({"statusCode": 403, "error": "Forbidden"});

      }

    } catch (err) {

      res.status(500).json({"statusCode": 500,"error": "Internal Server Error"});

    }

  });

  // create and send otp to phone - POST "/v1/users/@me/otp/gen"
  api.post("/@me/otp/gen", authenticate, async (req:IReq, res:express.Response) => {

    const {error} = genOtpSchema.validate(req.body);

    if (error) return res.status(400).json({'statusCode':400,"error":error.details[0].message});

    try {

      if (req.grant_type == "password") {

        const otp = await otpGen.generate(6, { alphabets: false, digits: true, upperCase: false, specialChars: false });

        const newOTP = new OTP({
          otp,
          id: req.id,
          phone_number: req.body.phone_number
        });

        await newOTP.save();

        await twiCli.messages.create({
          "body": `Your Venomous Verification code is: ${otp}`,
          "from": config.get("phone"),
          "to": req.body.phone_number
        });

        res.status(200).json({"statusCode": 200,"message": "Sent Message"});

      } else {

        res.status(403).json({"statusCode": 403,"error": "Forbidden"});

      }

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

    }

  });

  // update email endpoint - PUT "/v1/users/@me/edit/email"
  api.put("/@me/edit/email", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      const {error} = updateEmailSchema.validate(req.body);

      if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

      try {

        const user = await User.findOne({email: req.body.new_email});

        if (user) return res.status(400).json({"statusCode":400,"error":"Email Already Used"});

        const user2 = await User.findOne({_id: req.id});

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
  api.get("/@me/2fa/generate", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      try {

        const user = await User.findOne({_id: req.id});

        if (user.two_factor == true) return res.status(400).json({"statusCode":400,"error":"2fa already enabled"});

        const secret:any = await speakeasy.generateSecret({length: 20, name: `venomous.gg`});
  
        await User.updateOne({_id: req.id}, {two_factor_secret: secret.base32});
  
        const qr = await QRCode.toDataURL(secret.otpauth_url);
  
        res.status(200).json({'statusCode':200,"data":{"code": secret.base32, "QR": qr}});
  
      } catch (err) {
  
        console.log(err);
  
        res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
  
      }

    } else {
      res.status(403).json({"statusCode":403,"error":"Forbidden"});
    }

  });

  // enable 2fa endpoint - PUT "/v1/users/@me/2fa/enable"
  api.put("/@me/2fa/enable", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      try {

        const user = await User.findOne({_id: req.id});

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

          const codes = await generateRecovery(req.id);

          res.status(200).json({"statusCode":200,"data": {"codes": codes}});

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

  // disable 2fa endpoint - DELETE "/v1/users/@me/2fa/disable"
  api.delete("/@me/2fa/disable", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      const {error} = disable2faSchema.validate(req.body);

      if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

      const user = await User.findOne({_id: req.id});

      if (user.two_factor == false) return res.status(400).json({"statusCode":400,"error":"2fa not enabled"});

      const recoverycode = await RecoveryCode.findOne({code: req.body.code, id: req.id});

      if (recoverycode) {

        user.two_factor = false;

        await user.save();

        await RecoveryCode.deleteMany({id: req.id});

        res.status(200).json({"statusCode":200,"message":"Diabled 2fa"});

      } else {

        const verified = await speakeasy.totp.verify({
          secret: user.two_factor_secret,
          encoding: "base32",
          token: req.body.code,
          window: 0
        });

        if (!verified) res.status(400).json({"statusCode":400,"error":"Invalid Code"});

        user.two_factor = false;

        await user.save();

        await RecoveryCode.deleteMany({id: req.id});

        res.status(200).json({"statusCode":200,"message":"Diabled 2fa"});

      }


    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

    }

  });

  return api;

}

// genarte recovery codes
const generateRecovery = async (id:string) => {

  let codes: string[] = [];

  const code1:string = await Utils.generateRecoveryCode();

  codes.push(code1);

  const code2:string = await Utils.generateRecoveryCode();

  codes.push(code2);

  const code3:string = await Utils.generateRecoveryCode();

  codes.push(code3);

  const code4:string = await Utils.generateRecoveryCode();

  codes.push(code4);

  const code5:string = await Utils.generateRecoveryCode();

  codes.push(code5);

  const code6:string = await Utils.generateRecoveryCode();

  codes.push(code6);

  const code7:string = await Utils.generateRecoveryCode();

  codes.push(code7);

  const code8:string = await Utils.generateRecoveryCode();

  codes.push(code8);

  const code9:string = await Utils.generateRecoveryCode();

  codes.push(code9);

  const code10:string = await Utils.generateRecoveryCode();

  codes.push(code10);

  codes.forEach(async (code) => {

    const newCode = new RecoveryCode({
      code,
      id
    });

    await newCode.save();

  });

  return codes;

}

// send email
const sendEmail = async (code:string, email:string) => {
  
  let transporter = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.get("emailusername"),
      pass: config.get("emailpass"),
    }
  });

  try {

    const info = await transporter.sendMail({
      from: `"Venomous" <${config.get("emailusername")}>`,
      to: email,
      subject: "Email Verifcation",
      text: code
    });

    return true;

  } catch (err) {

    try {

      const info = await transporter.sendMail({
        from: `"Venomous" <${config.get("emailusername")}>`,
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
  new_password: Joi.string().min(6).max(40).required(),
  code: Joi.string().required()
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

// gen otp request schema
const genOtpSchema = Joi.object({
  phone_number: Joi.string().required()
});

// edit phone number request schema
const editPhoneNumberSchema = Joi.object({
  code: Joi.string().required()
});

// disable 2fa request schema
const disable2faSchema = Joi.object({
  code: Joi.string().required()
});