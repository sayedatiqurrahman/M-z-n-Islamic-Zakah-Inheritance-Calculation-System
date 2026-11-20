import { z } from "zod";

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
  heirs: z.array(z.object({
    type: heirType,
    count: z.number().int().min(0).max(50),
  })).max(30),
}).strict();

export type InheritanceRequest = z.infer<typeof inheritanceRequestSchema>;
