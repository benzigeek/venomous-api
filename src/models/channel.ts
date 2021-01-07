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

interface IChannel extends mongoose.Document {
  name: string,
  owner: IChannelOwner,
  stream_key: string,
  offline_screen: string,
  channel_meta_img: string,
  chat_mode: string,
  live: boolean,
  stream_title: string,
  current_game: string
}

interface IChannelOwner {
  id: string,
  username: string
}

const Channel = new Schema({
  name: {type: String, required: true},
  owner: {
    uid: {type: String, required: true},
    username: {type: String, required: true}
  },
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

export default mongoose.model<IChannel>("channels", Channel);