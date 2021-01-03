import { Router } from 'express';
import { Client } from 'pg';
import Joi from 'joi';
import logger from 'jethro';

export default (db:Client) => {

  const api = Router();

  api.post("/register", async (req, res) => {

    const {error} = registerSchema.validate(req.body);

    if (error) return res.status(400).json({"statusCode":400,"error":error.details[0].message});

    try {

      const response = await db.query("SELECT * FROM users WHERE users.email = $1", [req.body.email]);

      if (response.rows[0]) return res.status(400).json({"statusCode":400,"error":"Email already used"});

      // continue here

    } catch (err) {
      logger("error", "Postgres", err);
    }

  });

  return api;

}

// register request validation schema
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(40).required()
});