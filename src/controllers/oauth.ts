import { Router } from 'express';

export default () => {

  let api = Router();

  api.post("/token", (req, res) => {

    if (req.query.grant_type == "authorization_code") {


    } else if (req.query.grant_type == "refresh_token") {

      
    }

  });

  return api;

}