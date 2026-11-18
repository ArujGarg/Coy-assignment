import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SwipeError, swipe } from "@/lib/matching";
import { ME } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { targetId, direction } = body ?? {};
  if (typeof targetId !== "string" || (direction !== "like" && direction !== "pass")) {
    return NextResponse.json({ error: 'expected { targetId: string, direction: "like" | "pass" }' }, { status: 400 });
  }
  try {
    return NextResponse.json(swipe(getDb(), ME, targetId, direction));
  } catch (e) {
    if (e instanceof SwipeError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
