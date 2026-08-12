import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";
import { sendSuccess } from "../utils/responseWrapper";
import * as userService from "../services/userService";

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, age, blood_type, weight, phone_number, avatar_url } = req.body;
  const user = await userService.updateProfile(req.user, id, {
    name,
    age: age ? parseInt(age) : null,
    blood_type: blood_type || null,
    weight: weight ? parseFloat(weight) : null,
    phone_number: phone_number || null,
    avatar_url: avatar_url || null,
  });
  return sendSuccess(res, { message: "Profile updated successfully", user }, undefined, 200);
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getProfile(req.user, req.params.id);
  return sendSuccess(res, user, undefined, 200);
});

export const getAllGuardians = asyncHandler(async (req: AuthRequest, res: Response) => {
  const guardians = await userService.listGuardians(req.user);
  return sendSuccess(res, guardians, undefined, 200);
});

export const registerFcmToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  await userService.registerFcmToken(req.user?.id, req.body.fcm_token);
  return sendSuccess(res, { success: true, message: "FCM token registered successfully" }, undefined, 200);
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  await userService.deleteAccount(req.user, req.params.id);
  return sendSuccess(res, { message: "Account deleted successfully" }, undefined, 200);
});
