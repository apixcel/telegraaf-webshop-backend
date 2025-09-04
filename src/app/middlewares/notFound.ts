import { Request, Response } from "express";

const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: false,
    statusCode: 404,
    message: "Not Found",
    origin: {
      path: req.originalUrl,
      method: req.method,
    },
  });
};

export default notFound;
