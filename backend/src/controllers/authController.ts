import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import { AppError } from "../utils/AppError";
import * as authService from "../services/authService";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const user = await authService.register({ name, email, password, role });
  return sendSuccess(res, { message: "User registered successfully", user }, undefined, 201);
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, deviceId, deviceName, androidVersion } = req.body;
  const result = await authService.login(email, password, { deviceId, deviceName, androidVersion });
  return sendSuccess(res, { message: "Login successful", ...result }, undefined, 200);
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return sendSuccess(res, { message: "User logged out successfully." }, undefined, 200);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, result, undefined, 200);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, code, new_password } = req.body;
  await authService.resetPassword(email, code, new_password);
  return sendSuccess(res, {
    message: "Password reset successful. You can now log in with your new password.",
  }, undefined, 200);
});

export const refreshUserToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw AppError.badRequest("Refresh token is required");
  }
  const result = await authService.refresh(refreshToken);
  return sendSuccess(res, result, undefined, 200);
});
