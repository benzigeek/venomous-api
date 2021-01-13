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

interface IVerifyCode extends mongoose.Document {
  code: string,
  id: string
}

const VerifyCode = new Schema({
  code: {type: String, required: true},
  id: {type: String, required: true},
  createdAt: { type: Date, expires: 3600, default: Date.now }
});

export default mongoose.model<IVerifyCode>("codes", VerifyCode);