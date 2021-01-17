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
import { response, Router } from 'express';
import Joi from 'joi';
import logger from 'jethro';
import argon2 from 'argon2';
import Utils from '../utils';
import nodemailer from 'nodemailer';
import config from 'config';
import speakeasy from 'speakeasy';
import otpGen from 'otp-generator';
import twilio from 'twilio';

// import models
import User from '../models/user';
import AuthToken from '../models/authtokens';
import RefreshToken from '../models/refreahtokens';
import Channel from '../models/channel';
import VerifyCode from '../models/verifycode';
import OTP from '../models/otp';
import OTPGateway from '../models/otpgateway';


// import middleware
import { authenticate } from '../middleware';
import recoverycode from '../models/recoverycode';

const twiCli = twilio(config.get("twilio.sid"), config.get("twilio.token"));

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

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        hash
      });

      const u = await newUser.save();

      await createChannel(newUser.id, newUser.username);

      const token = await Utils.generateToken();

      const newToken = new AuthToken({
        token,
        grant_type: "password",
        id: u._id
      });

      await newToken.save();

      const refreshToken = await Utils.generateToken();

      const newRefreshToken = new RefreshToken({
        token: refreshToken,
        grant_type: "password",
        id: u._id
      });

      await newRefreshToken.save();

      var dt = new Date();
      dt.setMinutes( dt.getMinutes() + 420 );

      const code = await Utils.generateVerifyCode();

      const newCode = new VerifyCode({
        code,
        id: u._id
      });

      await newCode.save();

      res.status(200).json({
        "statusCode": 200,
        "access_token": token,
        "refresh_token": refreshToken,
        "token_type": "Bearer",
        "expires": dt.getTime()
      });

      await sendEmail(code, newUser.email);

    } catch (err) {
      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
      logger("error", "Mongo Database", err);
    }

  });

  // login endpoint - POST "/v1/auth/login"
  api.post("/login", async (req:any, res) => {

    const {error} = loginSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const user = await User.findOne({email: req.body.email});

      if (!user) return res.status(400).json({"statusCode":400,"error":"Invalid email or password"});

      if (await argon2.verify(user.hash, req.body.password)) {

        if (user.two_factor == true) {

          try {

            const newGatewayToken = await Utils.generateOtpGatewayToken();

            const newOtpGatway = new OTPGateway({
              gateway_token: newGatewayToken,
              id: user.id
            });

            await newOtpGatway.save();

            res.status(200).json({"statusCode":200,"gateway_token": newGatewayToken});

          } catch (err) {

            console.log(err);

            res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
          }

        } else {

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

        }

      } else {
      
        return res.status(400).json({"statusCode":400,"error":"Invalid email or password"});

      }

    } catch (err) {

      console.log(err);

      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  });

  // generate otp codes with sms
  api.post("/otp/gen", async (req, res) => {

    const {error} = OTPSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const gateway = await OTPGateway.findOne({gateway_token: req.body.gateway_token});

      if (!gateway) return res.status(400).json({"statusCode": 400,"error": "Invalid Gateway"});

      const otp = await otpGen.generate(6, { alphabets: false, digits: true, upperCase: false, specialChars: false });

      const user = await User.findOne({_id: gateway.id});

      const newOTP = new OTP({
        otp,
        id: gateway.id,
        phone_number: user.phone_number
      });

      await newOTP.save();

      await twiCli.messages.create({
        "body": `Your Venomous Verification code is: ${otp}`,
        "from": config.get("phone"),
        "to": user.phone_number
      });

      res.status(200).json({"statusCode": 200,"message": "Sent Message"});

    } catch (err) {

      console.log(err);

      res.status(500).json({"statusCode": 500,"error": "Internal Server Error"});

    }

  });

  // verify otp codes - POST "/v1/auth/login/otp"
  api.post("/login/otp", async (req, res) => {

    const {error} = loginOtpSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const gateway = await OTPGateway.findOne({gateway_token: req.body.gateway_token});

      if (!gateway) return res.status(400).json({"statusCode":400,"error":"Ivalid Gateway"});

      if (req.body.code.includes("-")) {

        console.log("debug2");
            
        const code = await recoverycode.findOne({code: req.body.code, id: gateway.id});

        if (!code) return res.status(400).json({"statusCode":400,"error":"Invalid Code"});

        const token = await Utils.generateToken();

        const newToken = new AuthToken({
          id: gateway.id,
          token,
          grant_type: "password"
        });

        await newToken.save();

        const refreshToken = await Utils.generateToken();

        const newRefreshToken = new RefreshToken({
          id: gateway.id,
          token: refreshToken,
          grant_type: "password"
        });

        await newRefreshToken.save();

        let dt = new Date();
        dt.setMinutes( dt.getMinutes() + 420 );

        await recoverycode.deleteMany({code: req.body.code, id:gateway.id});

        return res.status(200).json({
          "statusCode": 200,
          "access_token": token,
          "refresh_token": refreshToken,
          "token_type": "Bearer",
          "expires": dt.getTime()
        });

      } else {

        const otp = await OTP.findOne({otp: req.body.code, id: gateway.id});

        console.log(otp);

        if (!otp) {

          const user = await User.findOne({id: gateway.id});
  
          const verify = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: "base32",
            token: req.body.code
          });
  
          if (!verify) return res.status(400).json({"statusCode": 400,"error":"Invalid Code"});
  
          const token = await Utils.generateToken();
  
          const newToken = new AuthToken({
            id: gateway.id,
            token,
            grant_type: "password"
          });
  
          await newToken.save();
  
          const refreshToken = await Utils.generateToken();
  
          const newRefreshToken = new RefreshToken({
            id: gateway.id,
            token: refreshToken,
            grant_type: "password"
          });
  
          await newRefreshToken.save();
  
          await OTPGateway.deleteMany({id: gateway.id});
  
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

          console.log("debug")
  
          const token = await Utils.generateToken();
  
          const newToken = new AuthToken({
            id: gateway.id,
            token,
            grant_type: "password"
          });
  
          await newToken.save();
  
          const refreshToken = await Utils.generateToken();
  
          const newRefreshToken = new RefreshToken({
            id: gateway.id,
            token: refreshToken,
            grant_type: "password"
          });
  
          await newRefreshToken.save();
  
          await OTP.deleteMany({id: gateway.id});
  
          await OTPGateway.deleteMany({id: gateway.id});
  
          let dt = new Date();
          dt.setMinutes( dt.getMinutes() + 420 );
  
          return res.status(200).json({
            "statusCode": 200,
            "access_token": token,
            "refresh_token": refreshToken,
            "token_type": "Bearer",
            "expires": dt.getTime()
          });
  
        }

      }

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

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
        id: token.id,
        token: token2,
        grant_type: "password"
      });

      await newToken.save();

      const refreshToken = await Utils.generateToken();

      const newRefreshToken = new RefreshToken({
        id: token.id,
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

  // resend email endpoint - POST "/v1/auth/resend"
  api.post("/resend", authenticate, async (req:any, res) => {

    if (req.grant_type == "password") {

      try {

        const user = await User.findOne({_id: req.id});
  
        const code = await Utils.generateVerifyCode();
  
        const newCode = new VerifyCode({
          code,
          id: user.id
        });
  
        await newCode.save();
  
        res.status(200).json({"statusCode":200,"message":"Sent Email"});
  
        await sendEmail(code, user.email);
  
      } catch (err) {
  
        res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
  
      }

    } else {

      res.status(403).json({"statusCode":403,"error":"Forbidden"});

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

  // verify email endpoint - PUT "/v1/auth/verify"
  api.put("/verify", authenticate, async (req:any, res) => {

    const {error} = verifySchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const code = await VerifyCode.findOne({code:req.body.code});

      if (!code) return res.status(400).json({"statusCode":400,"error":"Invalid Code"});

      await VerifyCode.deleteMany({id: req.id});

      await User.updateOne({_id: req.id}, {email_verifed: true});

      res.status(200).json({"statusCode": 200,"message": "successfully verified email"});

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

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

// create channnel object in db
const createChannel = async (id:string, username:string) => {
  
  try {

    const skey = await Utils.generateStreamKey();
    
    const newChannel = new Channel({
      name: username,
      owner: id,
      stream_key: skey 
    });

    await newChannel.save();

    return true;

  } catch (err) {
    throw err;
  }

};

// gen otp for login schema
const OTPSchema = Joi.object({
  gateway_token: Joi.string().required()
});

// register request validation schema
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required().regex(/^[a-zA-Z0-9]+$/),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(40).required()
});

// login request validation schema
const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
  code: Joi.string()
});

// refresh request validation schema
const refreshSchema = Joi.object({
  refresh_token: Joi.string().required()
});

// verify request validation schema
const verifySchema = Joi.object({
  code: Joi.string().required()
});

// login otp request schema
const loginOtpSchema = Joi.object({
  gateway_token: Joi.string().required(),
  code: Joi.string().required()
});