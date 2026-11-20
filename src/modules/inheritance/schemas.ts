import { z } from "zod";
import type { HeirType } from "./types";

const heirType = z.enum([
  "HUSBAND", "WIFE", "FATHER", "MOTHER",
  "PATERNAL_GRANDFATHER", "PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER",
  "SON", "DAUGHTER", "SONS_SON", "SONS_DAUGHTER",
  "FULL_BROTHER", "FULL_SISTER", "PATERNAL_BROTHER", "PATERNAL_SISTER",
  "MATERNAL_BROTHER", "MATERNAL_SISTER",
  "FULL_BROTHERS_SON", "PATERNAL_BROTHERS_SON", "PATERNAL_UNCLE",
  "FULL_PATERNAL_UNCLE", "OTHER_AGNATIC", "DISTANT_KINDRED",
]);

const money = z.number().finite().min(0).max(1e15);

export const inheritanceHeirSchema = z.object({
  type: heirType,
  count: z.number().int().min(0).max(50),
});

export const inheritanceRequestSchema = z.object({
  madhhab: z.literal("HANAFI"),
  methodologyVersion: z.string().min(1).max(64),
  currency: z.string().min(3).max(4),
  deceasedGender: z.enum(["MALE", "FEMALE"]),
  dateOfDeath: z.string().min(1),
  deceasedName: z.string().max(120).optional(),
  grossEstate: money,
  funeralExpenses: money,
  debts: money,
  wasiyyah: money,
  otherObligations: money,
  heirConsentToWasiyyah: z.boolean(),
  heirs: z.array(inheritanceHeirSchema).max(30),
}).strict();

export type InheritanceRequest = z.infer<typeof inheritanceRequestSchema>;

/** A deceased person of a Munasakha (مناسخة) calculation. */
export interface MunasakhaDeceasedInput {
  id: string;
  deceasedName?: string;
  deceasedGender: "MALE" | "FEMALE";
  dateOfDeath: string;
  grossEstate: number;
  funeralExpenses: number;
  debts: number;
  wasiyyah: number;
  otherObligations: number;
  heirConsentToWasiyyah: boolean;
  heirs: { type: HeirType; count: number }[];
  inheritsFrom?: { fromId: string; heirType: HeirType };
}

export const munasakhaRequestSchema = z.object({
  madhhab: z.literal("HANAFI"),
  methodologyVersion: z.string().min(1).max(64),
  currency: z.string().min(3).max(4),
  deceased: z.array(
    z.object({
      id: z.string().min(1).max(64),
      deceasedName: z.string().max(120).optional(),
      deceasedGender: z.enum(["MALE", "FEMALE"]),
      dateOfDeath: z.string().min(1),
      grossEstate: money,
      funeralExpenses: money,
      debts: money,
      wasiyyah: money,
      otherObligations: money,
      heirConsentToWasiyyah: z.boolean(),
      heirs: z.array(inheritanceHeirSchema).max(30),
      inheritsFrom: z.object({
        fromId: z.string().min(1).max(64),
        heirType,
      }).optional(),
    }),
  ).max(10),
}).strict();

export type MunasakhaRequest = z.infer<typeof munasakhaRequestSchema>;
