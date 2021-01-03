import express from 'express';
import DB from './db';
import Auth from './controllers/auth';

let router = express();

const initDB = async () => {
 
  const db = await DB();
  router.use("/auth", Auth(db));
  
}

initDB();

export default router;