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

import crypto from 'crypto';

const randomBytes = crypto.randomBytes;

class Utils {

  // generate refresh & access tokens
  async generateToken(): Promise<string> {

    try {

      const buffer = await randomBytes(256)
      return crypto.createHash('sha1').update(buffer).digest('hex');

    } catch (err) {

      throw err;

    }

  }

  // generate stream key
  async generateStreamKey(): Promise<string> {

    try {

      const buffer = await randomBytes(500);
      return crypto.createHash("sha1").update(buffer).digest("hex");
      
    } catch (err) {

      throw err;

    }

  }

  // generate verify codes
  async generateVerifyCode(): Promise<string> {

    try {

      const buffer = await randomBytes(300);
      return crypto.createHash('sha1').update(buffer).digest('hex');

    } catch (err) {

      throw err;

    }

  }

}

export default new Utils();