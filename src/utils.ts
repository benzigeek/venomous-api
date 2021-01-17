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

  // genarte raindom four char code
  async genearteRandomFourCharCode(length) {

    let result = "";

    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let charLength = characters.length;

    for (let i = 0; i < length; i++) {

      result += characters.charAt(Math.floor(Math.random() * charLength));

    }

    return result;

  }

  // generate recovery code
  async generateRecoveryCode(): Promise<string> {

    const code1 = await this.genearteRandomFourCharCode(4);

    const code2 = await this.genearteRandomFourCharCode(4);

    return code1 + "-" + code2;

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