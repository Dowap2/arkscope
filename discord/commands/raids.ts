import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { LEVEL_TIERS, getLevelTier } from "../lib/level.js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── /raids ────────────────────────────────────────────────────────────────
export const raidsCommand = {
  data: new SlashCommandBuilder()
    .setName("raids")
    .setDescription("공대 목록을 출력합니다"),

  async execute(interaction: ChatInputCommandInteraction) {
    const supabase = getSupabase();
    const { data: raids, error } = await supabase
      .from("raids")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !raids?.length) {
      await interaction.reply({ content: "공대가 없습니다.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("⚔️ 공대 목록")
      .setColor(0xf59e0b)
      .setDescription(
        raids
          .map(
            (r, i) =>
              `**${i + 1}.** ${r.name}${r.raid_name ? ` — ${r.raid_name}` : ""}\n` +
              `\`ID: ${r.id}\``
          )
          .join("\n\n")
      );

    await interaction.reply({ embeds: [embed] });
  },
};

// ─── /characters ───────────────────────────────────────────────────────────
export const charactersCommand = {
  data: new SlashCommandBuilder()
    .setName("characters")
    .setDescription("공대 캐릭터 목록을 레벨 구간별로 출력합니다")
    .addStringOption((opt) =>
      opt
        .setName("raid")
        .setDescription("공대 이름 (일부만 입력해도 됩니다)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("tier")
        .setDescription("레벨 구간 필터 (미입력 시 전체)")
        .setRequired(false)
        .addChoices(
          ...LEVEL_TIERS.map((t) => ({ name: t.label, value: t.label }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const raidQuery = interaction.options.getString("raid", true);
    const tierFilter = interaction.options.getString("tier");

    const supabase = getSupabase();

    // 공대 검색
    const { data: raids } = await supabase
      .from("raids")
      .select("id, name, raid_name")
      .ilike("name", `%${raidQuery}%`)
      .limit(1);

    if (!raids?.length) {
      await interaction.editReply(`"${raidQuery}" 공대를 찾을 수 없습니다.`);
      return;
    }

    const raid = raids[0];

    // 멤버 + 캐릭터 조회
    const { data: members } = await supabase
      .from("raid_members")
      .select("account_name, characters(*)")
      .eq("raid_id", raid.id);

    if (!members?.length) {
      await interaction.editReply(`**${raid.name}** 공대에 등록된 원정대가 없습니다.`);
      return;
    }

    // 전체 캐릭터 합산 + 정렬
    const allChars = members
      .flatMap((m) =>
        (m.characters as { character_name: string; class: string; item_level: number; }[]).map(
          (c) => ({ ...c, accountName: m.account_name })
        )
      )
      .sort((a, b) => Number(b.item_level) - Number(a.item_level));

    // 레벨 구간 필터
    const filtered = tierFilter
      ? allChars.filter((c) => getLevelTier(Number(c.item_level)).label === tierFilter)
      : allChars;

    if (!filtered.length) {
      await interaction.editReply(
        `**${raid.name}** — \`${tierFilter}\` 구간에 해당하는 캐릭터가 없습니다.`
      );
      return;
    }

    // 구간별 그룹핑
    const grouped = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const label = getLevelTier(Number(c.item_level)).label;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(c);
    }

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${raid.name}${raid.raid_name ? ` — ${raid.raid_name}` : ""}`)
      .setColor(0xf59e0b)
      .setFooter({ text: `총 ${filtered.length}명` });

    for (const [label, chars] of grouped) {
      const lines = chars
        .map((c) => `\`${String(Number(c.item_level).toFixed(2)).padStart(9)}\` ${c.character_name} (${c.class})`)
        .join("\n");

      // Discord embed field value 최대 1024자 제한 처리
      const chunks: string[] = [];
      let current = "";
      for (const line of lines.split("\n")) {
        if ((current + "\n" + line).length > 1020) {
          chunks.push(current);
          current = line;
        } else {
          current = current ? current + "\n" + line : line;
        }
      }
      if (current) chunks.push(current);

      chunks.forEach((chunk, i) => {
        embed.addFields({
          name: i === 0 ? `${label} (${chars.length}명)` : "​",
          value: chunk,
        });
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
