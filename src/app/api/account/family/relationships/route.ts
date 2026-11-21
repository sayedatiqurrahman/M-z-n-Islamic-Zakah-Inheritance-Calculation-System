import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  fromPersonId: z.string().min(1),
  toPersonId: z.string().min(1),
  relationType: z.enum(["PARENT_OF", "SPOUSE_OF", "SIBLING_OF", "GUARDIAN_OF", "OTHER"]),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid relationship.", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (d.fromPersonId === d.toPersonId) return NextResponse.json({ error: "A person cannot be linked to themselves." }, { status: 400 });

  const people = await prisma.familyPerson.findMany({
    where: { ownerUserId: user.id, id: { in: [d.fromPersonId, d.toPersonId] } },
    select: { id: true },
  });
  if (people.length !== 2) return NextResponse.json({ error: "One or both people were not found." }, { status: 404 });

  const rel = await prisma.familyRelationship.create({
    data: {
      ownerUserId: user.id,
      fromPersonId: d.fromPersonId,
      toPersonId: d.toPersonId,
      relationType: d.relationType,
      notes: d.notes?.trim() || null,
    },
  });
  return NextResponse.json({
    relationship: {
      id: rel.id,
      fromPersonId: rel.fromPersonId,
      toPersonId: rel.toPersonId,
      relationType: rel.relationType,
      notes: rel.notes,
      createdAt: rel.createdAt.toISOString(),
    },
  }, { status: 201 });
}
