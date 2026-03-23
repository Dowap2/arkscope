import { getCharacterArmory } from "@/lib/lostark/api";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const armory = await getCharacterArmory(decodeURIComponent(name));
  return NextResponse.json(armory);
}
