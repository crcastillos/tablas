import crypto from "crypto";

const FORMAT_MARKER = 0x01;
const PRF_HMAC_SHA256 = 0x00000001;
const ITERATIONS = 10000;
const SALT_SIZE = 16;
const SUBKEY_SIZE = 32;

function writeUInt32NetworkBytes(value: number, buffer: Buffer, offset: number): void {
  buffer.writeUInt32BE(value, offset);
}

function readUInt32NetworkBytes(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_SIZE);
  const subkey = crypto.pbkdf2Sync(password, salt, ITERATIONS, SUBKEY_SIZE, "sha256");
  const output = Buffer.alloc(13 + SALT_SIZE + SUBKEY_SIZE);
  output[0] = FORMAT_MARKER;
  writeUInt32NetworkBytes(PRF_HMAC_SHA256, output, 1);
  writeUInt32NetworkBytes(ITERATIONS, output, 5);
  writeUInt32NetworkBytes(SALT_SIZE, output, 9);
  salt.copy(output, 13);
  subkey.copy(output, 13 + SALT_SIZE);
  return output.toString("base64");
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const decoded = Buffer.from(hashedPassword, "base64");
    if (decoded.length < 13 || decoded[0] !== FORMAT_MARKER) {
      return false;
    }

    const prf = readUInt32NetworkBytes(decoded, 1);
    const iterations = readUInt32NetworkBytes(decoded, 5);
    const saltSize = readUInt32NetworkBytes(decoded, 9);
    if (prf !== PRF_HMAC_SHA256 || decoded.length < 13 + saltSize) {
      return false;
    }

    const salt = decoded.subarray(13, 13 + saltSize);
    const expectedSubkey = decoded.subarray(13 + saltSize);
    const actualSubkey = crypto.pbkdf2Sync(password, salt, iterations, expectedSubkey.length, "sha256");
    return crypto.timingSafeEqual(expectedSubkey, actualSubkey);
  } catch {
    return false;
  }
}
