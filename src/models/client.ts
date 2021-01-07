import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IApplication extends mongoose.Document {
  owner: IApplicationOwner,
  img: string,
  name: string,
  description: string,
  secret: string,
  client_id: string
}

interface IApplicationOwner {
  uid: string
}

const Application = new Schema({
  owner: {
    uid: {type: String, required: true}
  },
  img: {type: String, default: null},
  name: {type: String, required: true},
  description: {type: String, required: true},
  secret: {type: String, required: true},
  client_id: {type: String, required: true},
  redirect_uris: [{
    type: String,
    required: true
  }]
});

export default mongoose.model<IApplication>("applications", Application);