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

import mongoose from 'mongoose';
const Schema = mongoose.Schema;

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
  two_factor_secret: string
}

const User = new Schema({
  id: {type: String, required: true},
  username: {type: String, required: true},
  email: {type: String, required: true},
  hash: {type: String, required: true},
  staff: {type: Boolean, default: false},
  username_time: {type: Number, default: null},
  created: {type: Date, default: new Date()},
  email_verifed: {type: Boolean, default: false},
  two_factor: {type: Boolean, default: false},
  two_factor_secret: {type: String, default: null}
});

export default mongoose.model<IUser>("users", User);