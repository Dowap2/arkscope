import { NextResponse } from "next/server";
import { createRaid, getRaids } from "@/lib/supabase/raids";

export async function GET() {
  try {
    const raids = await getRaids();
    return NextResponse.json(raids);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, raid_name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "공대 이름을 입력해주세요." }, { status: 400 });
    }
    const raid = await createRaid(name.trim(), raid_name?.trim() || null);
    return NextResponse.json(raid, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
