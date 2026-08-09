import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import { sendEmail } from "../config/email";
import { logger } from "../utils/logger";
import crypto from "crypto";

// SECURITY: Fail hard at startup if JWT_SECRET is not set.
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");
}
const JWT_SECRET = process.env.JWT_SECRET;

// SECURITY FIX #23: Separate secret for refresh tokens.
// If JWT_REFRESH_SECRET is not set, falls back to JWT_SECRET (logs a warning).
// Add JWT_REFRESH_SECRET to your .env for proper secret separation.
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn("WARNING: JWT_REFRESH_SECRET not set. Using JWT_SECRET for refresh tokens. Set JWT_REFRESH_SECRET in .env for production.");
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate request
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    if (!["Elder", "Guardian"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be Elder or Guardian." });
    }

    // Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
      [name, email, hashedPassword, role],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    logger.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find User
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = userResult.rows[0];

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate Short-lived Access Token (15m) — signed with JWT_SECRET
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

    // Generate Longer-lived Refresh Token (30d) — signed with JWT_REFRESH_SECRET
    // SECURITY FIX #23: Different secret prevents access token compromise from
    // also compromising refresh tokens.
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const deviceId = req.body.deviceId || crypto.randomUUID();

    // Store Refresh Token in DB (Allow multiple sessions per user)
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, device_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, refreshToken, deviceId, refreshExpiresAt]
    );

    const deviceName = req.body.deviceName || 'Android Device';
    const androidVersion = req.body.androidVersion || 'Android 14';

    try {
      await pool.query(
        `INSERT INTO user_devices (user_id, device_id, device_name, android_version, last_login)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, device_id)
         DO UPDATE SET last_login = NOW(), device_name = $3, android_version = $4`,
        [user.id, deviceId, deviceName, androidVersion]
      );
    } catch (devErr) {}

    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
    }
    res.status(200).json({
      message: "User logged out successfully.",
    });
  } catch (error) {
    logger.error("Logout Error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
// Generates a 6-digit verification code, saves it to the database with a 15-minute
// expiration, and emails it to the user.
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const checkUser = await pool.query("SELECT id, name FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);

    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "No account registered with this email" });
    }

    const user = checkUser.rows[0];

    // Generate a secure 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2
       WHERE id = $3`,
      [resetCode, expires, user.id]
    );

    // Email html content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #2C3E50; max-width: 600px; border: 1px solid #EAEAEA; border-radius: 10px;">
        <h2 style="color: #6C63FF; text-align: center;">SithaMithuru Password Recovery</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset the password for your SithaMithuru account. Use the verification code below to complete the process. This code will expire in 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2C3E50; background: #F8F9FA; padding: 15px 30px; border-radius: 10px; border: 1px dashed #6C63FF;">
            ${resetCode}
          </span>
        </div>
        <p style="color: #95A5A6; font-size: 13px; text-align: center;">If you did not make this request, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail(email, "SithaMithuru Password Reset Code", emailHtml);

    res.status(200).json({
      success: true,
      message: "Verification code sent to email",
    });
  } catch (error: any) {
    logger.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error sending recovery code" });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
// Validates the 6-digit code and replaces the password hash.
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, new_password } = req.body;

    if (!email || !code || !new_password) {
      return res.status(400).json({ message: "Email, code, and new_password are required" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Query user and check token
    const userRes = await pool.query(
      `SELECT id, reset_token, reset_token_expires
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "No account registered with this email" });
    }

    const user = userRes.rows[0];

    if (!user.reset_token || user.reset_token !== code.trim()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    // Hash the new password and update user record
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error: any) {
    logger.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error resetting password" });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const tokenRes = await pool.query(
      `SELECT rt.*, u.role FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1`,
      [refreshToken]
    );

    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const tokenRecord = tokenRes.rows[0];

    if (new Date(tokenRecord.expires_at) < new Date()) {
      await pool.query("DELETE FROM refresh_tokens WHERE id = $1", [tokenRecord.id]);
      return res.status(401).json({ message: "Expired refresh token" });
    }

    // Verify with JWT_REFRESH_SECRET (separate from access token secret)
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };

    const newAccessToken = jwt.sign({ id: decoded.id, role: tokenRecord.role }, JWT_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign({ id: decoded.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE id = $3`,
      [newRefreshToken, refreshExpiresAt, tokenRecord.id]
    );

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh Token Error:", error);
    res.status(401).json({ message: "Invalid refresh token payload" });
  }
};

