import sql from "mssql";

import { getSqlPool } from "@/lib/sql/sqlServer";

export type SqlParamType = sql.ISqlTypeFactory | sql.ISqlTypeFactoryWithLength | sql.ISqlTypeFactoryWithNoParams;

export interface SqlParam {
  name: string;
  type: SqlParamType;
  value: unknown;
}

function shouldUseInferredType(param: SqlParam): boolean {
  const typeCandidate = param.type as { type?: unknown } | undefined;
  return Boolean(
    typeof param.type === "function" ||
      (typeCandidate && typeof typeCandidate === "object" && typeof typeCandidate.type === "function"),
  );
}

export async function runQuery<T>(query: string, params: SqlParam[] = []): Promise<T[]> {
  const pool = await getSqlPool();
  const request = pool.request();
  for (const param of params) {
    try {
      if (shouldUseInferredType(param)) {
        // #region agent log
        fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
          body: JSON.stringify({
            sessionId: "4182c6",
            runId: "post-fix",
            hypothesisId: "H8",
            location: "src/lib/sql/db.ts:23",
            message: "Using inferred SQL type fallback in runQuery",
            data: {
              paramName: param.name,
              valueType: param.value === null ? "null" : typeof param.value,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        request.input(param.name, param.value as never);
      } else {
        request.input(param.name, param.type as never, param.value as never);
      }
    } catch (error) {
      // #region agent log
      fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
        body: JSON.stringify({
          sessionId: "4182c6",
          runId: "pre-fix",
          hypothesisId: "H7",
          location: "src/lib/sql/db.ts:18",
          message: "runQuery request.input failed",
          data: {
            paramName: param.name,
            paramTypeTypeof: typeof param.type,
            paramTypeKeys:
              param.type && typeof param.type === "object"
                ? Object.keys(param.type as object).slice(0, 8)
                : [],
            paramHasInnerType: Boolean((param.type as { type?: unknown })?.type),
            errorMessage: error instanceof Error ? error.message : "unknown",
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }
  }
  let result;
  try {
    result = await request.query<T>(query);
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H7",
        location: "src/lib/sql/db.ts:47",
        message: "runQuery request.query failed",
        data: {
          paramSummary: params.slice(0, 6).map((param) => ({
            name: param.name,
            typeOfType: typeof param.type,
            hasTypeField: Boolean((param.type as { type?: unknown })?.type),
            typeFieldType: typeof (param.type as { type?: unknown })?.type,
            valueType: param.value === null ? "null" : typeof param.value,
          })),
          errorMessage: error instanceof Error ? error.message : "unknown",
          errorName: error instanceof Error ? error.name : typeof error,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw error;
  }
  return result.recordset;
}

export async function runExecute(query: string, params: SqlParam[] = []): Promise<void> {
  const pool = await getSqlPool();
  const request = pool.request();
  for (const param of params) {
    try {
      if (shouldUseInferredType(param)) {
        // #region agent log
        fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
          body: JSON.stringify({
            sessionId: "4182c6",
            runId: "post-fix",
            hypothesisId: "H8",
            location: "src/lib/sql/db.ts:83",
            message: "Using inferred SQL type fallback in runExecute",
            data: {
              paramName: param.name,
              valueType: param.value === null ? "null" : typeof param.value,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        request.input(param.name, param.value as never);
      } else {
        request.input(param.name, param.type as never, param.value as never);
      }
    } catch (error) {
      // #region agent log
      fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
        body: JSON.stringify({
          sessionId: "4182c6",
          runId: "pre-fix",
          hypothesisId: "H7",
          location: "src/lib/sql/db.ts:53",
          message: "runExecute request.input failed",
          data: {
            paramName: param.name,
            paramTypeTypeof: typeof param.type,
            paramTypeKeys:
              param.type && typeof param.type === "object"
                ? Object.keys(param.type as object).slice(0, 8)
                : [],
            paramHasInnerType: Boolean((param.type as { type?: unknown })?.type),
            errorMessage: error instanceof Error ? error.message : "unknown",
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }
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
