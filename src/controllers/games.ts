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
import { authenticate } from '../middleware';

// import models
import Game from '../models/game';
import User from '../models/user';

// import types
import { IReq } from '../types';

export default () => {

  const api = express.Router();

  // get game by id - GET "/v1/games/:id"
  api.get("/:id", async (req:IReq, res:express.Response) => {

    try {

      const game = await Game.findOne({_id: req.params.id});

      if (!game) return res.status(404).json({"statusCode":400,"error":"Game Not Found"});

      res.status(200).json({"statusCode":200,"data": game});

    } catch (err) {

      res.status(500).json({"statusCode":500,"error":"Internal Server Error"});

    }

  });

  // create new game - POST "/v1/games/create"
  api.post("/create", authenticate, async (req:IReq, res:express.Response) => {
  
    if (req.grant_type == "password") {
    
      const user = await User.findOne({_id: req.id});

      if (user.staff == true) {

        const game = await Game.findOne({name: req.body.name});

        if (game) return res.status(400).json({"statusCode": 400,"error": "Game already exists"});

        const newGame = new Game({
          name: req.body.name
        });

        await newGame.save();

        res.status(200).json({"statusCode": 200, "message": "Created Game"});

      } else {
        res.status(403).json({"statusCode":403,"error":"Forbidden"});
      }

    } else {
      res.status(403).json({"statusCode": 403, "error": "Forbidden"});
    }

  });

  // delete game - DELETE "/v1/games/remove/:id"
  api.delete("/remove/:id", authenticate, async (req:IReq, res:express.Response) => {

    if (req.grant_type == "password") {

      try {

        const user = await User.findOne({_id: req.id});

        if (user.staff == true) {

          const game = await Game.findOne({_id: req.params.id});

          if (!game) return res.status(404).json({"statusCode": 404,"error": "Game Not Found"});

          await Game.deleteOne({_id: req.params.id});

          res.status(200).json({"statusCode": 200,"message": "Deleted Game"});

        } else {

          res.status(403).json({"statusCode": 403,"error":"Forbidden"});

        }
      } catch (err) {
        res.status(500).json({"statusCode": 500,"error": "Internal Server Error"});
      }

    } else {

      res.status(403).json({"statusCode": 403,"error":"Forbidden"});

    }

  });

  return api;

}