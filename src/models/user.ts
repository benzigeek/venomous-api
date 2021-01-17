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
  two_factor_secret: string,
  phone_number: string
}

const User = new Schema({
  username: {type: String, required: true},
  email: {type: String, required: true},
  hash: {type: String, required: true},
  staff: {type: Boolean, default: false},
  username_time: {type: Number, default: null},
  created: {type: Date, default: new Date()},
  email_verifed: {type: Boolean, default: false},
  two_factor: {type: Boolean, default: false},
  two_factor_secret: {type: String, default: null},
  phone_number: {type: String, default: null}
});

User.method("toClient", () => {
  
  // @ts-ignore
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id; 
  
});

export default mongoose.model<IUser>("users", User);