"use client";

import { calculateInheritance } from "@/modules/inheritance/engine";
import { inheritanceRequestSchema, type InheritanceRequest } from "@/modules/inheritance/schemas";
import { calculateZakah } from "@/modules/zakah/engine";
import { zakahRequestSchema, type ZakahRequest } from "@/modules/zakah/schemas";
import { formatAmount } from "@/lib/formatting";

export type HistoryType = "zakah" | "inheritance";

export interface LocalHistoryItem {
  id: string;
  type: HistoryType;
  title: string;
  createdAt: string;
  currency: string;
  summary: string;
  supported: boolean;
  local?: boolean;
}

export interface LocalHistoryStep {
  step: number;
  title: string;
  calculation: string;
  result: string;
  fiqhPrinciple: string;
  reason: string;
}

export interface LocalHistoryDetail extends LocalHistoryItem {
  input: unknown;
  steps: LocalHistoryStep[];
}

const HISTORY_KEY = "mizan:history:v1";
const DRAFT_ZAKAH_KEY = "mizan:draft:zakah:v1";
const DRAFT_INHERITANCE_KEY = "mizan:draft:inheritance:v1";
const SETTINGS_KEY = "mizan:settings:v1";

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  if (!hasWindow()) return null;
  return safeParse<T>(window.localStorage.getItem(key));
}

function writeJson(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/storage errors.
  }
}

function removeKey(key: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function localId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapSteps(steps: { step: number; title: string; calculation: string; result: string; fiqhPrinciple: string; reason: string }[]): LocalHistoryStep[] {
  return steps.map((s) => ({
    step: s.step,
    title: s.title,
    calculation: s.calculation,
    result: s.result,
    fiqhPrinciple: s.fiqhPrinciple,
    reason: s.reason,
  }));
}

export function loadLocalHistory(): LocalHistoryDetail[] {
  const items = readJson<LocalHistoryDetail[]>(HISTORY_KEY);
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i && typeof i.id === "string" && (i.type === "zakah" || i.type === "inheritance"));
}

export function saveLocalHistory(items: LocalHistoryDetail[]): void {
  writeJson(HISTORY_KEY, items.slice(0, 100));
}

export function upsertLocalHistory(detail: LocalHistoryDetail): LocalHistoryDetail {
  const items = loadLocalHistory();
  const idx = items.findIndex((i) => i.id === detail.id && i.type === detail.type);
  if (idx >= 0) items[idx] = detail;
  else items.unshift(detail);
  saveLocalHistory(items);
  return detail;
}

export function getLocalHistoryDetail(type: HistoryType, id: string): LocalHistoryDetail | null {
  return loadLocalHistory().find((i) => i.id === id && i.type === type) ?? null;
}

export function removeLocalHistory(type: HistoryType, id: string): boolean {
  const items = loadLocalHistory();
  const next = items.filter((i) => !(i.id === id && i.type === type));
  if (next.length === items.length) return false;
  saveLocalHistory(next);
  return true;
}

export function mergeHistory(server: LocalHistoryItem[], local: LocalHistoryDetail[]): LocalHistoryItem[] {
  const map = new Map<string, LocalHistoryItem>();
  for (const item of local) {
    map.set(`${item.type}:${item.id}`, { ...item, local: item.local ?? item.id.startsWith("local-") });
  }
  for (const item of server) {
    map.set(`${item.type}:${item.id}`, item);
  }
  return Array.from(map.values()).sort((a, b) => {
    const ta = Date.parse(a.createdAt) || 0;
    const tb = Date.parse(b.createdAt) || 0;
    return tb - ta;
  });
}

export function buildLocalZakahDetail(rawInput: unknown): LocalHistoryDetail {
  const input = zakahRequestSchema.parse(rawInput) as ZakahRequest;
  const result = calculateZakah(input);
  const createdAt = new Date().toISOString();
  const title = `Zakah – ${input.hawl.assessmentDate}`;
  const steps = result.supported ? mapSteps(result.steps) : mapSteps(result.steps ?? []);
  if (result.supported) {
    const payable = result.totalPayable ?? result.zakahPayable ?? 0;
    return {
      id: localId(),
      type: "zakah",
      title,
      createdAt,
      currency: result.currency ?? input.currency,
      summary: `Zakah payable ${formatAmount(payable, result.currency ?? input.currency, "en")}`,
      supported: true,
      local: true,
      input,
      steps,
    };
  }
  return {
    id: localId(),
    type: "zakah",
    title,
    createdAt,
    currency: input.currency,
    summary: result.reason ?? "Requires review",
    supported: false,
    local: true,
    input,
    steps,
  };
}

export function buildLocalInheritanceDetail(rawInput: unknown): LocalHistoryDetail {
  const input = inheritanceRequestSchema.parse(rawInput) as InheritanceRequest;
  const result = calculateInheritance(input);
  const createdAt = new Date().toISOString();
  const title = input.deceasedName ? `Inheritance – ${input.deceasedName}` : "Inheritance case";
  const steps = mapSteps(result.steps ?? []);
  if (result.supported) {
    const eligible = result.outcomes.filter((o) => o.status === "ELIGIBLE").length;
    const excluded = result.outcomes.filter((o) => o.status === "EXCLUDED").length;
    return {
      id: localId(),
      type: "inheritance",
      title,
      createdAt,
      currency: result.currency ?? input.currency,
      summary: `${eligible} eligible heir(s), ${excluded} excluded`,
      supported: true,
      local: true,
      input,
      steps,
    };
  }
  return {
    id: localId(),
    type: "inheritance",
    title,
    createdAt,
    currency: input.currency,
    summary: result.reason ?? "Requires review",
    supported: false,
    local: true,
    input,
    steps,
  };
}

export interface LocalSettings {
  locale: "en" | "ar" | "bn";
  currency: string;
  nisabMethod: "GOLD" | "SILVER";
}

export function loadLocalSettings(): LocalSettings | null {
  return readJson<LocalSettings>(SETTINGS_KEY);
}

export function saveLocalSettings(settings: LocalSettings): void {
  writeJson(SETTINGS_KEY, settings);
  if (hasWindow()) {
    try {
      window.localStorage.setItem("mizan-currency", settings.currency);
      window.localStorage.setItem("mizan-nisab-method", settings.nisabMethod);
    } catch {
      // ignore
    }
  }
}

export function loadDraft<T>(type: HistoryType): T | null {
  return readJson<T>(type === "zakah" ? DRAFT_ZAKAH_KEY : DRAFT_INHERITANCE_KEY);
}

export function saveDraft(type: HistoryType, value: unknown): void {
  writeJson(type === "zakah" ? DRAFT_ZAKAH_KEY : DRAFT_INHERITANCE_KEY, value);
}

export function clearDraft(type: HistoryType): void {
  removeKey(type === "zakah" ? DRAFT_ZAKAH_KEY : DRAFT_INHERITANCE_KEY);
}
