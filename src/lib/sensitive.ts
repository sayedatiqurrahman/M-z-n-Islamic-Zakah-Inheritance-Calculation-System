import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET?.trim() || (process.env.NODE_ENV !== "production" ? "mizan-dev-auth-secret-change-me" : "");
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  return createHash("sha256").update(`mizan-sensitive:${secret}`).digest();
}

export function encryptSensitive(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSensitive(payload?: string | null): string | null {
  if (!payload) return null;
  const [version, ivB64, tagB64, dataB64] = payload.split(".");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) return null;
  try {
    const key = getKey();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function last4(value?: string | null): string | null {
  const normalized = (value ?? "").replace(/\s+/g, "").trim();
  if (!normalized) return null;
  return normalized.slice(-4);
}

export function maskSensitive(last4Value?: string | null): string | null {
  if (!last4Value) return null;
  return `•••• ${last4Value}`;
}
