/* eslint-disable @typescript-eslint/no-unused-vars */

import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

import AppError from "../errors/AppError";
import handleCastError from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import handleValidationError from "../errors/handleValidationError";
import handleZodError from "../errors/zodError";
import { IErrorSources } from "../interface/error";

// eslint-disable-next-line no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  let message = "Something went wrong!";
  let statusCode = 500;
  let errorMessages: IErrorSources = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  console.log(error);

  if (error instanceof ZodError && isDev) {
    const simpleErr = handleZodError(error);
    statusCode = simpleErr?.statusCode;
    message = simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error instanceof mongoose.Error.ValidationError && isDev) {
    const simpleErr = handleValidationError(error);
    statusCode = simpleErr?.statusCode;
    message = isDev ? "Wrong Data format" : simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error instanceof mongoose.Error.CastError && isDev) {
    const simpleErr = handleCastError(error);
    statusCode = simpleErr?.statusCode;
    message = simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error.code === 11000) {
    const simpleErr = handleDuplicateError(error);
    statusCode = simpleErr?.statusCode;
    message = isDev ? "Duplicate Entry" : simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error instanceof AppError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error?.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error?.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorMessages: errorMessages,
    stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
