import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

export const pgPool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pgPool.on("error", (err) => {
  console.error("PostgreSQL Pool error:", err.message);
});

export const testDatabaseConnection = async () => {
  try {
    const result = await pgPool.query("SELECT NOW()");
    console.log("Neon database connected:", result.rows[0]);
    return true;
  } catch (err) {
    console.error("Neon connection test failed:", err.message);
    throw err;
  }
};