import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get this user's shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Parse request body for optional metadata
    const body = await request.json().catch(() => ({}));
    const { size, copies, bgColor } = body;

    // Log usage
    const { error: logError } = await supabase.from("usage_logs").insert({
      shop_id: shop.id,
      feature: "passport_photo",
      action: "printed",
      metadata: {
        size_id: size?.id ?? "unknown",
        copies: copies ?? 1,
        bg_color: bgColor ?? "#FFFFFF",
      },
    });

    if (logError) {
      console.error("[usage/passport] insert error:", logError.message);
      // Non-fatal — return success anyway
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[usage/passport] unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
