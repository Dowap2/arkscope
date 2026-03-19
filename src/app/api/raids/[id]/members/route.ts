import { NextResponse } from "next/server";
import { addRaidMember, deleteRaidMember } from "@/lib/supabase/members";
import { getAccountCharacters } from "@/lib/lostark/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raidId } = await params;
    const { characterName } = await request.json();

    if (!characterName?.trim()) {
      return NextResponse.json({ error: "캐릭터 이름을 입력해주세요." }, { status: 400 });
    }

    const siblings = await getAccountCharacters(characterName.trim());

    // 입력한 캐릭터와 같은 서버 캐릭터만 필터링
    const inputChar = siblings.find(
      (c) => c.CharacterName.toLowerCase() === characterName.trim().toLowerCase()
    );
    const serverName = inputChar?.ServerName;

    const filtered = serverName
      ? siblings.filter((c) => c.ServerName === serverName)
      : siblings;

    const characters = filtered.map((c) => ({
      character_name: c.CharacterName,
      server_name: c.ServerName,
      class: c.CharacterClassName,
      item_level: parseFloat(c.ItemAvgLevel.replace(/,/g, "")),
    }));

    await addRaidMember(raidId, characterName.trim(), characters);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { memberId } = await request.json();
    await deleteRaidMember(memberId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
