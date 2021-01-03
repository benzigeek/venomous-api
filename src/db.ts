import { Client } from 'pg';
import logger from 'jethro';
import config from 'config';

export default async (): Promise<Client>  => {

  try {
    
    const client = new Client({
      host: config.get("postgres.host"),
      port: config.get("postgres.port"),
      database: config.get("postgres.database"),
      user: config.get("postgres.username"),
      password: config.get("postgres.password")
    });

    await client.connect();

    logger("success", "Postgres", "Successfully connected to Postgresql database");

    return client;

  } catch (err) {
    logger("error", "Postgres", err);
    process.exit(1);
  }

}