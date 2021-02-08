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

// import stuffs
import express from 'express';
import mongoose from 'mongoose';

// request type
interface IReq extends express.Request {
  id: string
  grant_type: string,
  scope: string[],
  token: string
}

// User type
interface IUser extends mongoose.Document {
  id: string,
  email: string,
  username: string,
  hash: string,
  staff: boolean,
  created: Date,
  username_time: number,
  email_verified: boolean,
  two_factor: boolean,
  two_factor_secret: string,
  phone_number: string,
  sms_auth: boolean
}

// AuthToken type
interface IAuthToken extends mongoose.Document {
  token: string,
  id: string,
  scope: string[],
  grant_type: string,
  client_id: string
}

// channel type
interface IChannel extends mongoose.Document {
  id: string,
  name: string,
  owner: IUser,
  stream_key: string,
  offline_screen: string,
  channel_meta_img: string,
  chat_mode: string,
  live: boolean,
  stream_title: string,
  current_game: string
}

// channel mod type
interface IChannelMod extends mongoose.Document {
  username: string,
  channel: string,
  id: string
}

// channel vip type
interface IChannelVIP extends mongoose.Document {
  username: string,
  channel: string,
  id: string
}

// OTP type
interface IOTP extends mongoose.Document {
  otp: string,
  id: string,
  phone_number: string
}

// OTP gateway type
interface IOTPGateway extends mongoose.Document {
  gateway_token: string,
  id: string
}

// RecoveryCode type
interface IRecoveryCode extends mongoose.Document {
  code: string,
  id: string
}

// RefreshToken type
interface IRefreashToken extends mongoose.Document {
  token: string,
  id: string,
  scope: string[],
  grant_type: string,
  client_id: string
}

// verify code type
interface IVerifyCode extends mongoose.Document {
  code: string,
  id: string
}

// game type
interface IGame extends mongoose.Document {
  id: string,
  name: string,
  img: string,
  viewers: number
}

export {
  IReq,
  IAuthToken,
  IChannel,
  IUser,
  IChannelMod,
  IChannelVIP,
  IOTP,
  IOTPGateway,
  IRecoveryCode,
  IRefreashToken,
  IVerifyCode,
  IGame
}