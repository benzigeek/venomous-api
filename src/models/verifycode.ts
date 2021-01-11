import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IVerifyCode extends mongoose.Document {
  code: string,
  id: string
}

const VerifyCode = new Schema({
  code: {type: String, required: true},
  id: {type: String, required: true},
  createdAt: { type: Date, expires: 3600, default: Date.now }
});

export default mongoose.model<IVerifyCode>("codes", VerifyCode);