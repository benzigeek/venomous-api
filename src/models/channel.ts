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
import { IChannel } from '../types';

const Channel = new Schema({
  name: {type: String, required: true},
  owner: {type: Schema.Types.ObjectId, ref: "users"},
  stream_key: {type: String, required: true},
  offline_screen: {type: String, default: null},
  channel_meta_img: {type: String, default: null},
  chat_mode: {type: String, default: "normal"},
  live: {type: Boolean, default: false},
  stream_title: {type: String, default: null},
  current_game: {type: String, default: null},
  channel_img: {type: String, default: null},
  cahnnel_banner: {type: String, default: null}
});

Channel.method("toClient", () => {
  
  // @ts-ignore
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id; 
  
});

export default mongoose.model<IChannel>("channels", Channel);