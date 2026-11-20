import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const ANONYMOUS_COOKIE = "mizan_sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Read the anonymous session id without creating one. */
export async function getAnonymousId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANONYMOUS_COOKIE)?.value ?? null;
}

/**
 * Read or create the anonymous session id. Safe to call from a Route Handler:
 * Next.js permits cookie mutation there. A random opaque id is used so no
 * financial data is ever exposed in a URL or tied to personal information.
 */
export async function getOrCreateAnonymousId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANONYMOUS_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(ANONYMOUS_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}
