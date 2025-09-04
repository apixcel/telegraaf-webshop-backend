import { Response } from "express";

interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  meta?: {
    totalDoc: number | string;
    page: number | string;
    limit: number | string;
  };
}

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode || 200).json({
    success: data?.success,
    statusCode: data?.statusCode,
    message: data?.message,
    token: data?.token,
    data: data?.data,
    meta: data.meta && {
      limit: Number(data?.meta?.limit),
      page: Number(data?.meta?.page),
      totalDoc: Number(data?.meta?.totalDoc),
    },
  });
};

export default sendResponse;
