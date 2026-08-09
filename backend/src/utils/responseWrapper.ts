import { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  total_pages?: number;
  has_more: boolean;
}

export const sendSuccess = (
  res: Response,
  data: any,
  meta?: PaginationMeta,
  statusCode = 200
) => {
  res.status(statusCode).json({
    success: true,
    data,
    meta: meta || null,
    error: null,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  details?: any
) => {
  res.status(statusCode).json({
    success: false,
    data: null,
    meta: null,
    error: {
      message,
      details: details || null,
    },
  });
};
