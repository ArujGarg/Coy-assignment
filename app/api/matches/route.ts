import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMatches } from "@/lib/matching";
import { ME } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ matches: await getMatches(await getDb(), ME) });
}
