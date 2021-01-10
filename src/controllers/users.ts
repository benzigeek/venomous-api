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
import e, { Router } from 'express';
import { authenticate } from '../middleware';
import _ from 'lodash';

// import models
import User from '../models/user';

export default () => {

  const api = Router();

  // get current users object - GET "/v1/users/@me"
  api.get("/@me", authenticate, async (req:any, res) => {

    try {

      const user = await User.findOne({id: req.id});

      if (req.grant_type == "password") {

        const data = _.pick(user, ["id", "email", "username", "staff", "created"]);

        res.status(200).json({"statusCode":200,"data": data});

      } else {

        if (!req.scope[0]) {

          let index = req.scope.length + 1;

          req.scope.forEach((scope:any, i:number) => {

            if (scope == "email") {

              nextFunc();

            } else if (index == i) {

              nextFunc2();

            }

          });

          const nextFunc = () => {

            const data = _.pick(user, ["id", "username", "email", "staff", "created"]);

            res.status(200).json({"statusCode":200,"data": data});

          }

          const nextFunc2 = () => {

            const data = _.pick(user, ["id", "username", "staff", "created"]);

            res.status(200).json({"statusCode":200,"data": data});

          }
      
        }

      }

    } catch (err) {
      res.status(500).json({"statusCode":500,"error":"Internal server error"});
    }

  });

  return api;

}