import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "sithamithuru",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "5432"),
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(
      `✅ PostgreSQL Connected safely to: ${process.env.DB_NAME || "sithamithuru"}`,
    );
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default pool;
