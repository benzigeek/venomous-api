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

// import thirdpaty packages
import mongoose from 'mongoose';
import logger from 'jethro';
import config from 'config';

export default async ()  => {

  try {
    
    await mongoose.connect(config.get("mongo"), {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

    logger("success", "Mongo Database", "Successfully connected to database...");

  } catch (err) {
    logger("error", "Postgres", err);
    process.exit(1);
  }

}