import "server-only";

const REQUIRED_BASE_ENV = ["DefaultConnection", "JWT__Secret", "JWT__Issuer", "JWT__Audience"] as const;

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDefaultConnectionString(): string {
  return getRequiredEnvVar("DefaultConnection");
}

export function getJwtConfig() {
  const expires = Number(process.env.JWT__ExpiresMinutes ?? "60");
  return {
    secret: getRequiredEnvVar("JWT__Secret"),
    issuer: getRequiredEnvVar("JWT__Issuer"),
    audience: getRequiredEnvVar("JWT__Audience"),
    expiresMinutes: Number.isFinite(expires) && expires > 0 ? expires : 60,
  };
}

export function validateBootstrapEnvironment(): void {
  for (const variableName of REQUIRED_BASE_ENV) {
    getRequiredEnvVar(variableName);
  }
  getJwtConfig();
}

export function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.5-medium";
  return {
    apiKey,
    model,
  };
}
