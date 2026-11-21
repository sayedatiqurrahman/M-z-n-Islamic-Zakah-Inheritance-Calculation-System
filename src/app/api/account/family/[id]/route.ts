import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptSensitive, last4, maskSensitive } from "@/lib/sensitive";

export const runtime = "nodejs";

const updateSchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  gender: z.enum(["MALE", "FEMALE"]).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  dateOfDeath: z.string().nullable().optional(),
  isDeceased: z.boolean().optional(),
  email: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
  relationToOwner: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  nidNumber: z.string().trim().max(100).nullable().optional(),
  deathCertificateNumber: z.string().trim().max(100).nullable().optional(),
  identityVerificationStatus: z.enum(["UNDECLARED", "SELF_DECLARED", "PENDING_REVIEW", "VERIFIED", "REJECTED"]).optional(),
  identityVerificationNote: z.string().trim().max(500).nullable().optional(),
});

function toDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safePerson(p: any) {
  return {
    id: p.id,
    fullName: p.fullName,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : null,
    dateOfDeath: p.dateOfDeath ? p.dateOfDeath.toISOString().slice(0, 10) : null,
    isDeceased: p.isDeceased,
    email: p.email,
    relationToOwner: p.relationToOwner,
    notes: p.notes,
    nidMasked: maskSensitive(p.nidLast4),
    nidLast4: p.nidLast4,
    deathCertificateMasked: maskSensitive(p.deathCertificateLast4),
    deathCertificateLast4: p.deathCertificateLast4,
    identityVerificationStatus: p.identityVerificationStatus,
    identityVerifiedAt: p.identityVerifiedAt?.toISOString() ?? null,
    identityVerificationNote: p.identityVerificationNote,
    linkedUserId: p.linkedUserId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

async function getId(context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = await Promise.resolve(context.params);
  return params.id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await getId(context);
  const existing = await prisma.familyPerson.findFirst({ where: { id, ownerUserId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update.", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const data: any = {};
  if (d.fullName !== undefined) data.fullName = d.fullName;
  if (d.gender !== undefined) data.gender = d.gender;
  const dob = toDate(d.dateOfBirth);
  if (dob !== undefined) data.dateOfBirth = dob;
  const dod = toDate(d.dateOfDeath);
  if (dod !== undefined) data.dateOfDeath = dod;
  if (d.isDeceased !== undefined) data.isDeceased = d.isDeceased;
  if (d.email !== undefined) data.email = d.email?.trim() || null;
  if (d.relationToOwner !== undefined) data.relationToOwner = d.relationToOwner?.trim() || null;
  if (d.notes !== undefined) data.notes = d.notes?.trim() || null;
  if (d.identityVerificationStatus !== undefined) data.identityVerificationStatus = d.identityVerificationStatus;
  if (d.identityVerificationNote !== undefined) data.identityVerificationNote = d.identityVerificationNote?.trim() || null;
  if (d.identityVerificationStatus === "VERIFIED") data.identityVerifiedAt = new Date();

  if (d.nidNumber !== undefined) {
    const nid = d.nidNumber?.trim() || null;
    data.nidEncrypted = nid ? encryptSensitive(nid) : null;
    data.nidLast4 = nid ? last4(nid) : null;
  }
  if (d.deathCertificateNumber !== undefined) {
    const dc = d.deathCertificateNumber?.trim() || null;
    data.deathCertificateEncrypted = dc ? encryptSensitive(dc) : null;
    data.deathCertificateLast4 = dc ? last4(dc) : null;
  }

  if (d.identityVerificationStatus === undefined) {
    const finalDob = dob !== undefined ? dob : existing.dateOfBirth;
    const finalNidLast4 = d.nidNumber !== undefined ? (d.nidNumber?.trim() ? last4(d.nidNumber) : null) : existing.nidLast4;
    const finalDcLast4 =
      d.deathCertificateNumber !== undefined ? (d.deathCertificateNumber?.trim() ? last4(d.deathCertificateNumber) : null) : existing.deathCertificateLast4;
    const hasIdentityProof = Boolean(finalDob || finalNidLast4 || finalDcLast4);
    if (hasIdentityProof && existing.identityVerificationStatus === "UNDECLARED") {
      data.identityVerificationStatus = "SELF_DECLARED";
    }
  }

  const person = await prisma.familyPerson.update({ where: { id: existing.id }, data });
  return NextResponse.json({ person: safePerson(person) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await getId(context);
  const result = await prisma.familyPerson.deleteMany({ where: { id, ownerUserId: user.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
