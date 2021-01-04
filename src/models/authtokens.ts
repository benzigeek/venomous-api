import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IAuthToken extends mongoose.Document {
  token: string
}

const AuthToken = new Schema({
  token: {type: String, required: true},
  createdAt: { type: Date, expires: 25200, default: Date.now }
});

export default mongoose.model<IAuthToken>("tokens", AuthToken);