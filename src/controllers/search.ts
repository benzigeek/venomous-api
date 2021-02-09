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
import express from 'express';
import Joi from 'joi';
import _ from 'lodash';

// import models
import Game from '../models/game';
import Channel from '../models/channel';

// import types
import { IReq } from '../types';

export default () => {

  const api = express.Router();

  // search for games or channel
  api.get("/", async (req:IReq, res:express.Response) => {

    const {error} = searchSchema.validate(req.body);
    
    if (error) return res.status(400).json({"statusCode": 400,"error": error.details[0].message});

    try {
 
      const games = await Game.find({name: {$regex: req.body.query, $options: "i" }}).limit(5).exec();

      const channels = await Channel.find({name: {$regex: req.body.query, $options: "i"}}).limit(10).exec();

      let safechannels = [];

      channels.forEach((channel) => {

        channel.id = channel._id;

        let achannel = _.pick(channel, ["id", "name", "live", "stream_title"]);

        safechannels.push(achannel);

      });

      const data = {
        channels: safechannels,
        games
      }
      
      res.status(200).json({"statusCode": 200, "data": data});

    } catch (err) {

      console.log(err);

      res.status(500).json({"statusCode": 500,"error": "Internal Server Error"});
    }

  });

  return api;

}

// search request schema
const searchSchema = Joi.object({
  query: Joi.string().required().max(40).min(3)
});