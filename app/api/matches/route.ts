import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMatches } from "@/lib/matching";
import { ME } from "@/lib/types";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ matches: getMatches(getDb(), ME) });
}
