import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as authRepository from "../repositories/authRepository";
import { sendEmail } from "../config/email";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

// SECURITY: Fail hard at startup if JWT_SECRET is not set. No fallback —
// a prior version of this service (now replaced) shipped a hardcoded
// fallback secret that would have been a real vulnerability if ever wired in.
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");
}
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.JWT_REFRESH_SECRET) {
  logger.warn("JWT_REFRESH_SECRET not set. Using JWT_SECRET for refresh tokens. Set JWT_REFRESH_SECRET in .env for production.");
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const email = data.email.trim().toLowerCase();

  // The pre-check below is a fast-path UX improvement, not the security
  // boundary — users.email carries a real UNIQUE constraint (users_email_key),
  // so a concurrent duplicate registration still can't succeed even if two
  // requests race past this check at the same instant; the resulting 23505
  // is mapped to 409 by the global error handler.
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await authRepository.createUser({
    name: data.name,
    email,
    passwordHash,
    role: data.role,
  });

  return user;
};

export const login = async (
  email: string,
  password: string,
  device: { deviceId?: string; deviceName?: string; androidVersion?: string }
) => {
  const user = await authRepository.findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    throw AppError.unauthorized("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw AppError.unauthorized("Invalid credentials");
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const deviceId = device.deviceId || crypto.randomUUID();

  await authRepository.insertRefreshToken({ userId: user.id, token: refreshToken, deviceId, expiresAt: refreshExpiresAt });

  // Device tracking is best-effort telemetry, not required for login to
  // succeed — a failure here must never block authentication.
  try {
    await authRepository.upsertUserDevice({
      userId: user.id,
      deviceId,
      deviceName: device.deviceName || "Android Device",
      androidVersion: device.androidVersion || "Android 14",
    });
  } catch (err: any) {
    logger.warn(`[Login] Failed to record device for user ${user.id}: ${err.message}`);
  }

  return {
    token,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

export const logout = async (refreshToken?: string) => {
  if (refreshToken) {
    await authRepository.deleteRefreshTokenByToken(refreshToken);
  }
};

export const refresh = async (refreshToken: string) => {
  const tokenRecord = await authRepository.findRefreshTokenWithRole(refreshToken);
  if (!tokenRecord) {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    await authRepository.deleteRefreshTokenById(tokenRecord.id);
    throw AppError.unauthorized("Expired refresh token");
  }

  // Verifies signature/tamper-integrity in addition to the DB expiry check above.
  const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };

  const newAccessToken = jwt.sign({ id: decoded.id, role: tokenRecord.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const newRefreshToken = jwt.sign({ id: decoded.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await authRepository.rotateRefreshToken(tokenRecord.id, newRefreshToken, refreshExpiresAt);

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  "If an account exists with this email, a verification code has been sent.";

export const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await authRepository.findUserForPasswordReset(normalizedEmail);

  // SECURITY: always return the same generic message regardless of whether
  // the account exists — the previous version returned a 404 with "No
  // account registered with this email" for unknown addresses, letting an
  // attacker enumerate registered accounts by probing this endpoint. Only
  // send an email (and only generate/store a code) when a real account
  // exists; the HTTP response is identical either way.
  if (!user) {
    logger.info(`[ForgotPassword] Requested for unregistered email (no-op, generic response returned)`);
    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  }

  // SECURITY: crypto.randomInt is a CSPRNG — Math.random() is not suitable
  // for anything used as a credential, even a short-lived 6-digit code.
  const resetCode = crypto.randomInt(100000, 1000000).toString();
  const expires = new Date(Date.now() + RESET_CODE_TTL_MS);

  await authRepository.setResetToken(user.id, resetCode, expires);

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #2C3E50; max-width: 600px; border: 1px solid #EAEAEA; border-radius: 10px;">
      <h2 style="color: #1466C2; text-align: center;">SithaMithuru Password Recovery</h2>
      <p>Hello ${user.name},</p>
      <p>We received a request to reset the password for your SithaMithuru account. Use the verification code below to complete the process. This code will expire in 15 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2C3E50; background: #F8F9FA; padding: 15px 30px; border-radius: 10px; border: 1px dashed #1466C2;">
          ${resetCode}
        </span>
      </div>
      <p style="color: #95A5A6; font-size: 13px; text-align: center;">If you did not make this request, you can safely ignore this email.</p>
    </div>
  `;

  await sendEmail(email, "SithaMithuru Password Reset Code", emailHtml);

  return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
};

export const resetPassword = async (email: string, code: string, newPassword: string) => {
  const user = await authRepository.findUserForPasswordReset(email.trim().toLowerCase());
  if (!user) {
    // Same generic-failure principle as forgotPassword — a wrong code and a
    // nonexistent account should not be distinguishable to the caller.
    throw AppError.badRequest("Invalid or expired verification code");
  }

  const codeMatches =
    !!user.reset_token &&
    user.reset_token.length === code.trim().length &&
    crypto.timingSafeEqual(Buffer.from(user.reset_token), Buffer.from(code.trim()));

  if (!codeMatches) {
    throw AppError.badRequest("Invalid or expired verification code");
  }

  if (new Date(user.reset_token_expires) < new Date()) {
    throw AppError.badRequest("Invalid or expired verification code");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await authRepository.clearResetTokenAndSetPassword(user.id, passwordHash);
};
