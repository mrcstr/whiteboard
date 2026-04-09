import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@whiteboard/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Email and password (min 8 chars) required" },
        { status: 400 },
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { data: { id: user.id, email: user.email } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
