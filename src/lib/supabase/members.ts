import { createClient } from "./server";
import { Raid, RaidMember, Character } from "@/types";

export type MemberWithCharacters = RaidMember & {
  characters: Character[];
};

export type RaidDetail = Raid & {
  members: MemberWithCharacters[];
};

export async function getRaidDetail(id: string): Promise<RaidDetail | null> {
  const supabase = await createClient();

  const { data: raid, error: raidError } = await supabase
    .from("raids")
    .select("*")
    .eq("id", id)
    .single();

  if (raidError) return null;

  const { data: members, error: membersError } = await supabase
    .from("raid_members")
    .select("*, characters(*)")
    .eq("raid_id", id)
    .order("created_at", { ascending: true });

  if (membersError) throw membersError;

  const membersWithSortedChars = (members ?? []).map((m) => ({
    ...m,
    characters: [...(m.characters ?? [])].sort(
      (a, b) => Number(b.item_level) - Number(a.item_level)
    ),
  }));

  return { ...raid, members: membersWithSortedChars };
}

export async function addRaidMember(
  raidId: string,
  accountName: string,
  characters: {
    character_name: string;
    server_name: string;
    class: string;
    item_level: number;
  }[]
): Promise<void> {
  const supabase = await createClient();

  const { data: member, error: memberError } = await supabase
    .from("raid_members")
    .insert({ raid_id: raidId, account_name: accountName })
    .select()
    .single();

  if (memberError) throw memberError;

  if (characters.length > 0) {
    const { error: charError } = await supabase.from("characters").insert(
      characters.map((c) => ({ ...c, raid_member_id: member.id }))
    );
    if (charError) throw charError;
  }
}

export async function deleteRaidMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("raid_members").delete().eq("id", id);
  if (error) throw error;
}
