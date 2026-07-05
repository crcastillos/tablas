import sql from "mssql";

import { getSqlPool } from "@/lib/sql/sqlServer";

export type SqlParamType = sql.ISqlTypeFactory | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactoryWithNoParams;

export interface SqlParam {
  name: string;
  type: SqlParamType;
  value: unknown;
}

export async function runQuery<T>(query: string, params: SqlParam[] = []): Promise<T[]> {
  const pool = await getSqlPool();
  const request = pool.request();
  for (const param of params) {
    request.input(param.name, param.type as never, param.value as never);
  }
  const result = await request.query<T>(query);
  return result.recordset;
}

export async function runExecute(query: string, params: SqlParam[] = []): Promise<void> {
  const pool = await getSqlPool();
  const request = pool.request();
  for (const param of params) {
    request.input(param.name, param.type as never, param.value as never);
  }
  await request.query(query);
}

export function asDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function toBase64(value: Buffer | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return Buffer.from(value).toString("base64");
}
