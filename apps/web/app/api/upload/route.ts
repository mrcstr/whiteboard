import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Step 1: Check token
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "ENV_MISSING", detail: "BLOB_READ_WRITE_TOKEN is not set" },
      { status: 500 },
    );
  }

  // Step 2: Parse form data
  let file: File;
  try {
    const formData = await request.formData();
    const f = formData.get("file");
    if (!f || !(f instanceof File)) {
      return NextResponse.json(
        { error: "NO_FILE", detail: "No file in form data" },
        { status: 400 },
      );
    }
    file = f;
  } catch (e: any) {
    return NextResponse.json(
      { error: "PARSE_ERROR", detail: String(e?.message ?? e) },
      { status: 400 },
    );
  }

  // Step 3: Upload to Vercel Blob
  try {
    const blob = await put(`board-images/${Date.now()}-${file.name}`, file, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    const detail = e?.message ?? String(e);
    const stack = e?.stack ?? "";
    console.error("Blob upload error:", detail, stack);
    return NextResponse.json(
      { error: "BLOB_ERROR", detail, tokenPrefix: token.substring(0, 8) + "..." },
      { status: 500 },
    );
  }
}
