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

// import thirdparty packages
import express from 'express';
import DB from './db';

// import controllers
import Auth from './controllers/auth';
import Users from './controllers/users';
import Channels from './controllers/channels';
import Games from './controllers/games';
import Search from './controllers/search';

let router = express();

const initDB = async () => {
 
  const db = await DB();
  router.use("/auth", Auth());
  router.use("/users", Users());
  router.use("/channels", Channels());
  router.use("/games", Games());
  router.use("/search", Search());
  
}

initDB();

export default router;