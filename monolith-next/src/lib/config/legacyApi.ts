import "server-only";

const DEFAULT_LEGACY_API_URL = "http://localhost:5263/api";

export function getLegacyApiBaseUrl(): string {
  const configuredUrl = process.env.LEGACY_API_BASE_URL?.trim();
  const baseUrl = configuredUrl && configuredUrl.length > 0 ? configuredUrl : DEFAULT_LEGACY_API_URL;
  return baseUrl.replace(/\/+$/, "");
}
