import { Request, Response } from "express";
import pool from "../config/db";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, age, blood_type, weight, phone_number, avatar_url, primary_guardian_id } = req.body;

    const query = `
      UPDATE users 
      SET name = $1, age = $2, blood_type = $3, weight = $4, phone_number = $5, avatar_url = $6, primary_guardian_id = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, email, role, avatar_url, age, blood_type, weight, phone_number, primary_guardian_id
    `;

    const result = await pool.query(query, [
      name,
      age ? parseInt(age) : null,
      blood_type || null,
      weight ? parseFloat(weight) : null,
      phone_number || null,
      avatar_url || null,
      primary_guardian_id || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the updated user with joined guardian info
    const fullUserQuery = `
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.age, u.blood_type, u.weight, u.phone_number, u.primary_guardian_id,
             pg.name as guardian_name, pg.role as guardian_role
      FROM users u
      LEFT JOIN users pg ON u.primary_guardian_id = pg.id
      WHERE u.id = $1
    `;
    const finalResult = await pool.query(fullUserQuery, [id]);

    res.status(200).json({
      message: "Profile updated successfully",
      user: finalResult.rows[0]
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT u.id, u.name, u.email, u.role, u.avatar_url, u.age, u.blood_type, u.weight, u.phone_number, u.primary_guardian_id,
             pg.name as guardian_name, pg.role as guardian_role
      FROM users u
      LEFT JOIN users pg ON u.primary_guardian_id = pg.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server error retrieving user data" });
  }
};

export const getAllGuardians = async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT id, name FROM users WHERE role = 'Guardian'");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get Guardians Error:", error);
        res.status(500).json({ message: "Server error retrieving guardians" });
    }
}
