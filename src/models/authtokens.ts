import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IAuthToken extends mongoose.Document {
  token: string,
  uid: string,
  scope: string[],
  grant_type: string,
  client_id: string
}

const AuthToken = new Schema({
  token: {type: String, required: true},
  uid: {type: String, required: true},
  client_id: {type: String, defaut: false},
  grant_type: {type: String, required: true},
  scope: [{
    type: String, required: true
  }],
  createdAt: { type: Date, expires: 25200, default: Date.now }
});

export default mongoose.model<IAuthToken>("tokens", AuthToken);