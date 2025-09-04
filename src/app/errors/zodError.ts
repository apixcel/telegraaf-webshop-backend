import { ZodError, ZodIssue } from "zod";
import { IErrorSources, IGenericErrorRes } from "../interface/error";

const handleZodError = (error: ZodError): IGenericErrorRes => {
  const errorSources: IErrorSources = error.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue.path.length - 1].toString(),
      message: issue?.message,
    };
  });

  const statusCode = 400;
  return {
    statusCode,
    message: "Validation error",
    errorSources,
  };
};

export default handleZodError;
