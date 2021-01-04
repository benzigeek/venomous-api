import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IUser extends mongoose.Document {
  uid: string,
  email: string,
  username: string,
  hash: string,
  created: Date
}

const User = new Schema({
  uid: {type: String, required: true},
  username: {type: String, required: true},
  email: {type: String, required: true},
  hash: {type: String, required: true},
  created: {type: Date, default: new Date()}
});

export default mongoose.model<IUser>("users", User);