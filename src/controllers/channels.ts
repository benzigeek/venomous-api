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

// import thirdparty packages
import { Router } from 'express';
import _ from 'lodash';

// import models
import Channel from '../models/channel';

export default () => {

  let api = Router();
 
  // get channel by name endpoint - GET "/v1/cahnnels/@/<name>"
  api.get("/@/:name", async (req, res) => {
  
    try {

      let channel = await Channel.findOne({name: req.params.name}).populate("owner");

      if (!channel) return res.status(404).json({"statusCode":404,"error":"No Cahnnel Found"});

      let data:any = _.pick(channel, ["name", "id", "offline_screen", "channel_meta_img", "chat_mode", "live", "stream_title", "current_game", "channel_img", "channel_banner"]);

      let owner = _.pick(channel.owner[0], ["username", "id"]);

      data.owner = owner;

      res.status(200).json({"statusCode":200,"data":data});

    } catch (err) {
      console.log(err);
      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});
    }

  });

  // get cahnnel by id endpoint - GET "/v1/channels/<id>"
  api.get("/:id", async (req, res) => {
    
    try {

      const channel = await Channel.findOne({id: req.params.id});

      if (!channel) return res.status(404).json({"statusCode":404,"error":"Channel Not Found"});

      let data:any = _.pick(channel, ["name", "id", "offline_screen", "channel_meta_img", "chat_mode", "live", "stream_title", "current_game", "channel_img", "channel_banner"]);

      let owner = _.pick(channel.owner[0], ["username", "id"]);

      data.owner = owner;

      res.status(200).json({"statusCode":200,"data":data});

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

    }

  });

  return api;

}