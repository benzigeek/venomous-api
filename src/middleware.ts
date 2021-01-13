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

import AuthToken from './models/authtokens';

const authenticate = async (req, res, next) => {

  const header:string = req.header("Authorization");
  
  if (header.startsWith("Bearer")) {

    const token = header.split(" ")[1];

    try {

      const Token = await AuthToken.findOne({"token": token});

      if (!Token) return res.status(401).json({"statusCode":401,"error":"Unauthorized"});

      req.id = Token.id;

      req.token = token;

      req.grant_type = Token.grant_type;

      req.scope = Token.scope;

      next();

    } catch (err) {

      console.log(err);

      res.status(500).json({"statusCode":500,"error":"Internal server error"});

    }

  } else {
    res.status(401).json({"statusCode": 401,"error": "Unauthorized"});
  }

}

export {
  authenticate
}