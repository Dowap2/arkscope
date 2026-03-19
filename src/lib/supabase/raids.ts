import { createClient } from "./server";
import { Raid } from "@/types";

export async function getRaids(): Promise<Raid[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("raids")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createRaid(
  name: string,
  raidName: string | null
): Promise<Raid> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("raids")
    .insert({ name, raid_name: raidName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRaid(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("raids").delete().eq("id", id);
  if (error) throw error;
}
