import crypto from 'crypto';
import bluebird from 'bluebird';

const randomBytes = bluebird.promisify(crypto.randomBytes);

class Utils {

  async generateToken() {
    return randomBytes(256).then((buffer) => {
      return crypto
        .createHash('sha1')
        .update(buffer)
        .digest('hex');
    });
  }

}

export default new Utils();