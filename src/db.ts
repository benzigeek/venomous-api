import mongoose from 'mongoose';
import logger from 'jethro';
import config from 'config';

export default async ()  => {

  try {
    
    await mongoose.connect(config.get("mongo"), {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

    logger("success", "Mongo Database", "Successfully connected to database...");

  } catch (err) {
    logger("error", "Postgres", err);
    process.exit(1);
  }

}