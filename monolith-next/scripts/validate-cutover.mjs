const baseUrl = process.env.MONOLITH_BASE_URL ?? "http://localhost:3000";
const endpoints = ["/api/health", "/api/cutover/validate"];

async function main() {
  const results = [];

  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`);
    const body = await response.json().catch(() => null);
    results.push({
      endpoint,
      status: response.status,
      ok: response.ok,
      body,
    });
  }

  const hasFailures = results.some((item) => !item.ok);
  console.log(JSON.stringify({ baseUrl, results }, null, 2));

  if (hasFailures) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
