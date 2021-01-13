/*

 __      __                                         
 \ \    / /                                         
  \ \  / /__ _ __   ___  _ __ ___   ___  _   _ ___  
   \ \/ / _ \ '_ \ / _ \| '_ ` _ \ / _ \| | | / __| 
    \  /  __/ | | | (_) | | | | | | (_) | |_| \__ \ 
     \/ \___|_| |_|\___/|_| |_| |_|\___/ \__,_|___/ 
                                                    
* Author: benzigeek
* Repo: github.com/benzigeek/venomous-api
* Copyright (c) 2021 Jordan (benzigeek)
*/

import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import compression from 'compression';
import logger from 'jethro';

import config from 'config';
import routes from './routes';

const app = express();
const server = http.createServer(app);

app.use(helmet());

app.use(bodyParser.json({
  limit: "100kb"
}));

app.get("/", (req, res) => {
  res.status(200).json({"statusCode":200,"message":"Online"});
});

app.use(compression({
  level: 3
}));

app.use("/v1", routes);

app.all("*", (req, res) => {
  res.status(404).json({"statusCode":404,"error":"Not Found.","message":"Endpint Not Found"});
});

server.listen(config.get("port"), () => logger("success", "HTTP", `Server listening on port ${config.get("port")}`));

export default app;
