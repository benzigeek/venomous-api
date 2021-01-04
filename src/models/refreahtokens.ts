import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IRefreashToken extends mongoose.Document {
  token: string
}

const AuthToken = new Schema({
  token: {type: String, required: true},
  createdAt: { type: Date, expires: 31556952, default: Date.now }
});

export default mongoose.model<IRefreashToken>("refreshtokens", AuthToken);