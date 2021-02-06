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

// import types
import { IRefreashToken } from '../types'

const RefreshToken = new Schema({
  token: {type: String, required: true},
  id: {type: String, required: true},
  client_id: {type: String, defaut: false},
  grant_type: {type: String, required: true},
  scope: [{
    type: String, required: true
  }],
  createdAt: { type: Date, expires: 31556952, default: Date.now }
});

export default mongoose.model<IRefreashToken>("refreshtokens", RefreshToken);