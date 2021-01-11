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

import crypto from 'crypto';
import bluebird from 'bluebird';

const randomBytes = bluebird.promisify(crypto.randomBytes);

class Utils {

  // generate refresh & access tokens
  async generateToken(): Promise<string> {
    return randomBytes(256).then((buffer) => {
      return crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex');
    });
  }

  // generate stream key
  async generateStreamKey(): Promise<string> {

    return randomBytes(500).then((buffer) => {
      return crypto.createHash('sha1')
      .update(buffer)
      .digest('hex');
    });

  }

  // generate verify codes
  async generateVerifyCode(): Promise<string> {

    return randomBytes(300).then((buffer) => {
      return crypto.createHash('sha1')
      .update(buffer)
      .digest('hex');
    });

  }

}

export default new Utils();