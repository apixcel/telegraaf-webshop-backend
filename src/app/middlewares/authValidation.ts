import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import { IUserJWTPayload, TRoles } from "../interface/auth.interface";
import User from "../models/user.model";
import { IUserInfoRequest } from "../utils/catchAsync";

const isAuthenticatedUser = (isOptional?: boolean) => {
  return async (req: IUserInfoRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;
      if (!token && isOptional === true) {
        return next();
      }

      if (!token) {
        throw new AppError(401, "Unauthorized");
      }

      let decoded: IUserJWTPayload | undefined = undefined;

      try {
        decoded = jwt.verify(token, config.ACCESS_TOKEN.SECRET as string) as IUserJWTPayload;
      } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!decoded && isOptional === false) {
        throw new AppError(401, "Invalid Authentications.");
      }

      const user = await User.findOne({
        _id: decoded?._id,
      });
      if (!user) {
        if (isOptional === true) {
          return next();
        }
        throw new AppError(404, "User does not exist.");
      }
      const payload = user.toObject();
      req.user = {
        _id: payload._id.toString(),
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

const authorizeRoles = (...roles: TRoles[]) => {
  return (req: IUserInfoRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(
        new AppError(403, `User type: ${req.user?.role} is not allowed to access this resouce `)
      );
    }
    next();
  };
};

const authMiddleware = { isAuthenticatedUser, authorizeRoles };
export default authMiddleware;
