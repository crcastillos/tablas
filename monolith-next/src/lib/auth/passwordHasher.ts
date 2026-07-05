import crypto from "crypto";

const FORMAT_MARKER = 0x01;
const PRF_HMAC_SHA1 = 0x00000000;
const PRF_HMAC_SHA256 = 0x00000001;
const PRF_HMAC_SHA512 = 0x00000002;
const ITERATIONS = 100000;
const SALT_SIZE = 16;
const SUBKEY_SIZE = 32;

function getDigestAlgorithm(prf: number): string | null {
  switch (prf) {
    case PRF_HMAC_SHA1:
      return "sha1";
    case PRF_HMAC_SHA256:
      return "sha256";
    case PRF_HMAC_SHA512:
      return "sha512";
    default:
      return null;
  }
}

function writeUInt32NetworkBytes(value: number, buffer: Buffer, offset: number): void {
  buffer.writeUInt32BE(value, offset);
}

function readUInt32NetworkBytes(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_SIZE);
  const subkey = crypto.pbkdf2Sync(password, salt, ITERATIONS, SUBKEY_SIZE, "sha512");
  const output = Buffer.alloc(13 + SALT_SIZE + SUBKEY_SIZE);
  output[0] = FORMAT_MARKER;
  writeUInt32NetworkBytes(PRF_HMAC_SHA512, output, 1);
  writeUInt32NetworkBytes(ITERATIONS, output, 5);
  writeUInt32NetworkBytes(SALT_SIZE, output, 9);
  salt.copy(output, 13);
  subkey.copy(output, 13 + SALT_SIZE);
  return output.toString("base64");
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const decoded = Buffer.from(hashedPassword, "base64");
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "src/lib/auth/passwordHasher.ts:34",
        message: "Password hash decoded",
        data: {
          decodedLength: decoded.length,
          formatMarker: decoded.length > 0 ? decoded[0] : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (decoded.length < 13 || decoded[0] !== FORMAT_MARKER) {
      return false;
    }

    const prf = readUInt32NetworkBytes(decoded, 1);
    const iterations = readUInt32NetworkBytes(decoded, 5);
    const saltSize = readUInt32NetworkBytes(decoded, 9);
    const digestAlgorithm = getDigestAlgorithm(prf);
    // #region agent log
    fetch("http://127.0.0.1:7556/ingest/94f640ef-f292-4d4c-8e4c-66a96b1ade92", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4182c6" },
      body: JSON.stringify({
        sessionId: "4182c6",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "src/lib/auth/passwordHasher.ts:57",
        message: "Password hash metadata parsed",
        data: {
          prf,
          iterations,
          saltSize,
          digestAlgorithm,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!digestAlgorithm || decoded.length < 13 + saltSize) {
      return false;
    }

    const salt = decoded.subarray(13, 13 + saltSize);
    const expectedSubkey = decoded.subarray(13 + saltSize);
    const actualSubkey = crypto.pbkdf2Sync(password, salt, iterations, expectedSubkey.length, digestAlgorithm);
    return crypto.timingSafeEqual(expectedSubkey, actualSubkey);
  } catch {
    return false;
  }
}
