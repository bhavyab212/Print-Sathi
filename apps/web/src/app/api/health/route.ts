import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "print-sathi-web",
    timestamp: new Date().toISOString(),
  });
}
