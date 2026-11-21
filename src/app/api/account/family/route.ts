import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptSensitive, last4, maskSensitive } from "@/lib/sensitive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  dateOfDeath: z.string().optional().nullable(),
  isDeceased: z.boolean().optional(),
  email: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
  relationToOwner: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  nidNumber: z.string().trim().max(100).optional().nullable(),
  deathCertificateNumber: z.string().trim().max(100).optional().nullable(),
  identityVerificationStatus: z.enum(["UNDECLARED", "SELF_DECLARED", "PENDING_REVIEW", "VERIFIED", "REJECTED"]).optional(),
});

function toDate(value?: string | null): Date | null {
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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const people = await prisma.familyPerson.findMany({
    where: { ownerUserId: user.id },
    orderBy: [{ isDeceased: "desc" }, { updatedAt: "desc" }],
  });
  const relationships = await prisma.familyRelationship.findMany({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    people: people.map(safePerson),
    relationships: relationships.map((r) => ({
      id: r.id,
      fromPersonId: r.fromPersonId,
      toPersonId: r.toPersonId,
      relationType: r.relationType,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid family record.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const nid = d.nidNumber?.trim() || null;
  const deathCert = d.deathCertificateNumber?.trim() || null;
  const dob = toDate(d.dateOfBirth);
  const dod = toDate(d.dateOfDeath);
  const hasIdentityProof = Boolean(nid || deathCert || dob);
  const person = await prisma.familyPerson.create({
    data: {
      ownerUserId: user.id,
      fullName: d.fullName,
      gender: d.gender ?? null,
      dateOfBirth: dob,
      dateOfDeath: dod,
      isDeceased: d.isDeceased ?? Boolean(dod),
      email: d.email?.trim() || null,
      relationToOwner: d.relationToOwner?.trim() || null,
      notes: d.notes?.trim() || null,
      nidEncrypted: nid ? encryptSensitive(nid) : null,
      nidLast4: nid ? last4(nid) : null,
      deathCertificateEncrypted: deathCert ? encryptSensitive(deathCert) : null,
      deathCertificateLast4: deathCert ? last4(deathCert) : null,
      identityVerificationStatus: d.identityVerificationStatus ?? (hasIdentityProof ? "SELF_DECLARED" : "UNDECLARED"),
    },
  });
  return NextResponse.json({ person: safePerson(person) }, { status: 201 });
}
