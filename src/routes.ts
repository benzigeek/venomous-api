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

import express from 'express';
import DB from './db';

// import controllers
import Auth from './controllers/auth';
import Users from './controllers/users';

let router = express();

const initDB = async () => {
 
  const db = await DB();
  router.use("/auth", Auth());
  router.use("/users", Users());
  
}

initDB();

export default router;