import * as Joi from 'joi';

export const envMapping = () => ({
  // APP
  NODE_ENV: process.env.NODE_ENV,
  APP_PORT: process.env.APP_PORT,
  APP_EMAIL: process.env.APP_EMAIL,
  APP_EMAIL_PASSWORD: process.env.APP_EMAIL_PASSWORD,
  APP_FRONTEND_HOST: process.env.APP_FRONTEND_HOST,

  // SANKHYA HOST
  SNK_HOST: process.env.SNK_HOST,
  SNK_GATEWAY: process.env.SNK_GATEWAY,

  // SANKHYA AUTH
  SNK_X_TOKEN: process.env.SNK_X_TOKEN,
  SNK_CLIENT_ID: process.env.SNK_CLIENT_ID,
  SNK_CLIENT_SECRET: process.env.SNK_CLIENT_SECRET,

  // SANKHYA API
  SNK_LOAD_RECORDS: process.env.SNK_LOAD_RECORDS,
  SNK_LOAD_VIEW: process.env.SNK_LOAD_VIEW,
  SNK_EXECUTE_QUERY: process.env.SNK_EXECUTE_QUERY,
  SNK_LOGIN: process.env.SNK_LOGIN,
  SNK_SAVE: process.env.SNK_SAVE,

  // DATABASE
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DATABASE_URL: process.env.DATABASE_URL,
});

export const envSchema = Joi.object({
  // APP
  NODE_ENV: Joi.string().valid('dev', 'hml', 'prod').default('dev'),
  APP_PORT: Joi.number().default(3000),
  APP_EMAIL: Joi.string().required(),
  APP_EMAIL_PASSWORD: Joi.string().required(),
  APP_FRONTEND_HOST: Joi.string().uri().required(),

  // SANKHYA HOST
  SNK_HOST: Joi.string().uri().required(),
  SNK_GATEWAY: Joi.string().required(),

  // SANKHYA AUTH
  SNK_X_TOKEN: Joi.string().required(),
  SNK_CLIENT_ID: Joi.string().required(),
  SNK_CLIENT_SECRET: Joi.string().required(),

  // SANKHYA API
  SNK_LOAD_RECORDS: Joi.string().required(),
  SNK_LOAD_VIEW: Joi.string().required(),
  SNK_EXECUTE_QUERY: Joi.string().required(),
  SNK_LOGIN: Joi.string().required(),
  SNK_SAVE: Joi.string().required(),

  // DATABASE
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DATABASE_URL: Joi.string().uri().required(),
});
