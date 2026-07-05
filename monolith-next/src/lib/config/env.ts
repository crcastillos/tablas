import "server-only";

const REQUIRED_BASE_ENV = ["DefaultConnection"] as const;
const JWT_PREFIX = "JWT";

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

export function getJwtEnvironment(): Record<string, string> {
  const jwtEntries = Object.entries(process.env).filter(([key, value]) => {
    return key.startsWith(JWT_PREFIX) && Boolean(value && value.trim().length > 0);
  });

  return Object.fromEntries(jwtEntries as Array<[string, string]>);
}

export function validateBootstrapEnvironment(): void {
  for (const variableName of REQUIRED_BASE_ENV) {
    getRequiredEnvVar(variableName);
  }

  if (Object.keys(getJwtEnvironment()).length === 0) {
    throw new Error("Missing JWT* environment variables.");
  }
}
