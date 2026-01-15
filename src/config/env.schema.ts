import * as Joi from 'joi';

export const envMapping = () => ({
  // ENVIRONMENT
  NODE_ENV: process.env.NODE_ENV,
  APP_PORT: process.env.APP_PORT,

  // SANKHYA AUTH
  SNK_X_TOKEN: process.env.SNK_X_TOKEN,
  SNK_CLIENT_ID: process.env.SNK_CLIENT_ID,
  SNK_CLIENT_SECRET: process.env.SNK_CLIENT_SECRET,

  // SANKHYA API
  SNK_HOST: process.env.SNK_HOST,
  SNK_GATEWAY: process.env.SNK_GATEWAY,
});

export const envSchema = Joi.object({
  // ENVIRONMENT
  NODE_ENV: Joi.string().valid('dev', 'hml', 'prod').default('dev'),
  APP_PORT: Joi.number().default(3000),

  // SANKHYA AUTH
  SNK_X_TOKEN: Joi.string().required(),
  SNK_CLIENT_ID: Joi.string().required(),
  SNK_CLIENT_SECRET: Joi.string().required(),

  // SANKHYA API
  SNK_HOST: Joi.string().required(),
  SNK_GATEWAY: Joi.string().required(),
});
