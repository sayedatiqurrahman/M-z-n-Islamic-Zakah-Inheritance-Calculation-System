import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration details.", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: hashPassword(password),
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true },
    });

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[auth:register]", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
