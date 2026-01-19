import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  location: RequestLocation = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[location];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: { errors },
          },
        });
        return;
      }

      req[location] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return validate(schema, 'query');
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return validate(schema, 'params');
}
