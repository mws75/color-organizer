import mysql from "mysql2/promise";

// Connection pool for PlanetScale (shared one-offs-v2 database).
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // PlanetScale requires SSL
      ssl: {
        rejectUnauthorized: true,
      },
    });
  }
  return pool;
}

export type QueryParam = string | number | null;

export async function executeQuery<T>(
  query: string,
  params: QueryParam[] = [],
): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(query, params);
  return rows as T;
}
