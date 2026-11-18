import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getFeed } from "@/lib/matching";
import { ME } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ profiles: getFeed(getDb(), ME) });
}
