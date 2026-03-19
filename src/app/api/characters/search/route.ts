import { NextResponse } from "next/server";
import { getAccountCharacters } from "@/lib/lostark/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name?.trim()) {
    return NextResponse.json({ error: "캐릭터 이름을 입력해주세요." }, { status: 400 });
  }

  try {
    const characters = await getAccountCharacters(name.trim());
    return NextResponse.json(characters);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
