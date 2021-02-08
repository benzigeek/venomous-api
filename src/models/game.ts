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
import { IGame } from '../types';

const Game = new Schema({
  name: {type: String, required: true, uniqe: true},
  img: {type: String, required: true},
  viewers: {type: Number, default: 0}
});

Game.method("toClient", () => {
  
  // @ts-ignore
  let obj = this.toObject();

  obj.id = obj._id;
  delete obj._id; 
  
});

export default mongoose.model<IGame>("games", Game);