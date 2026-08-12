import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps an async Express handler so a thrown/rejected error is forwarded to
// next(err) — and therefore to the centralized errorHandler — instead of
// requiring every controller function to repeat its own try/catch that logs
// and formats a 500 response by hand.
export const asyncHandler = <
  Req extends Request = Request,
  Res extends Response = Response
>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
};
