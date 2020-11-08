import { NextFunction, Request, Response } from 'express';
import Joi, { Schema } from 'joi';

export default {
  validateBody(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.validate(req.body);
        if (result.error) {
          return res
            .status(400)
            .json({ success: false, error: result.error });
        }
      } catch (error: any) {
        return res.status(400).json({ success: false, error });
      }
      next();
    };
  },
  schemas: {
    authSchema: Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },
};
