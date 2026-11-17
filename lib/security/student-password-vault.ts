import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getEncryptionKey(): Buffer {
  const value = process.env.STUDENT_PASSWORD_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("Student password encryption key is not configured correctly.");
  }

  return Buffer.from(value, "hex");
}

export function encryptStudentPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptStudentPassword(payload: string): string {
  const parts = payload.split(".");

  if (parts.length !== 3) {
    throw new Error("Stored temporary password is invalid.");
  }

  const [ivText, authTagText, encryptedText] = parts;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64"),
  );

  decipher.setAuthTag(Buffer.from(authTagText, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}