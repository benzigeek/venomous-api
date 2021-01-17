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

interface IOTPGateway extends mongoose.Document {
  gateway_token: string,
  id: string
}

const OTPGateway = new Schema({
  gateway_token: {type: String, required: true},
  id: {type: String, required: true},
  createdAt: { type: Date, expires: 25200, default: Date.now }
});

export default mongoose.model<IOTPGateway>("otpgateways", OTPGateway);