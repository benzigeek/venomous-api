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

interface IAuthToken extends mongoose.Document {
  token: string,
  id: string,
  scope: string[],
  grant_type: string,
  client_id: string
}

const AuthToken = new Schema({
  token: {type: String, required: true},
  id: {type: String, required: true},
  client_id: {type: String, defaut: false},
  grant_type: {type: String, required: true},
  scope: [{
    type: String, required: true
  }],
  createdAt: { type: Date, expires: 25200, default: Date.now }
});

export default mongoose.model<IAuthToken>("tokens", AuthToken);