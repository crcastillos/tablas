import "server-only";
import sql from "mssql";

import { getDefaultConnectionString } from "@/lib/config/env";

declare global {
  var __monolithSqlPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

export async function getSqlPool(): Promise<sql.ConnectionPool> {
  if (!global.__monolithSqlPoolPromise) {
    const connectionString = getDefaultConnectionString();
    global.__monolithSqlPoolPromise = sql.connect(connectionString);
  }

  return global.__monolithSqlPoolPromise;
}

export async function closeSqlPool(): Promise<void> {
  if (!global.__monolithSqlPoolPromise) {
    return;
  }

  const pool = await global.__monolithSqlPoolPromise;
  await pool.close();
  global.__monolithSqlPoolPromise = undefined;
}
