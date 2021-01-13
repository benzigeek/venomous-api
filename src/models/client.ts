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

interface IApplication extends mongoose.Document {
  owner: IApplicationOwner,
  img: string,
  name: string,
  description: string,
  secret: string,
  client_id: string
}

interface IApplicationOwner {
  uid: string
}

const Application = new Schema({
  owner: {
    uid: {type: String, required: true}
  },
  img: {type: String, default: null},
  name: {type: String, required: true},
  description: {type: String, required: true},
  secret: {type: String, required: true},
  redirect_uris: [{
    type: String,
    required: true
  }]
});

Application.method("toClient", () => {
  
  // @ts-ignore
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id; 
  
});

export default mongoose.model<IApplication>("applications", Application);