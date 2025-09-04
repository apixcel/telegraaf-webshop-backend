import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodSchema } from "zod";

export const validSchema = (schema: ZodSchema) => {
  return async (req: Request, _: Response, next: NextFunction) => {
    const { success, error } = await schema.safeParseAsync(req.body);

    if (success) {
      next();
    } else {
      next(error);
    }
  };
};
export const validTextSchema = (schema: AnyZodObject) => {
  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      const parsedData = JSON.parse(req.body.data);

      const { success, error } = await schema.safeParseAsync(parsedData);

      if (!success) {
        return next(error);
      }
      req.body = parsedData;
      next();
    } catch {
      next(new Error("Invalid JSON format"));
    }
  };
};
