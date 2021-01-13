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

interface IChannelVIP extends mongoose.Document {
  username: string,
  channel: string,
  id: string
}

const ChannelVIP = new Schema({
  username: {type: String, required: true},
  channel: {type: String, required: true},
  id: {type: String, required: true}
});

export default mongoose.model<IChannelVIP>("channelvips", ChannelVIP);