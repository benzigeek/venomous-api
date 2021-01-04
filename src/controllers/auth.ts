import { Router } from 'express';
import { Client } from 'pg';
import Joi from 'joi';
import logger from 'jethro';
import argon2, { argon2id } from 'argon2';
import intformat from 'biguint-format';
import FlakeId from 'flake-idgen';

export default (db:Client) => {

  const api = Router();

  api.post("/register", async (req, res) => {

    const {error} = registerSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const response = await db.query("SELECT * FROM users WHERE users.email = $1", [req.body.email]);

      if (response.rows[0]) return res.status(400).json({"statusCode":400,"error":"Email already used"});

      const response2 = await db.query("SELECT * FROM users WHERE users.username = $1", [req.body.username]);

      if (response2.rows[0]) return res.status(400).json({"statusCode":400,"error":"Username already used"});

      const FlakeGen = new FlakeId();

      const id = intformat(FlakeGen.next(), 'dec');

      const hash = await argon2.hash(req.body.email, {type: argon2id, saltLength: 45});

      logger("debug", "test", parseInt(id));

      await db.query("INSERT INTO users (id,username,email,hash) VALUES ($1,$2,$3,$4);", [id, req.body.username, req.body.email, hash]);

      return res.status(200).json({"statusCode":200,"message":"successfully created user"});

    } catch (err) {
      logger("error", "Postgres", err);
    }

  });

  return api;

}

// register request validation schema
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required().regex(/^[a-zA-Z0-9]+$/),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(40).required()
});