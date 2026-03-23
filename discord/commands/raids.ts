import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { LEVEL_TIERS, getLevelTier } from "../lib/level.js";

type RawCharacter = {
  character_name: string;
  class: string;
  item_level: number;
};

type CharWithAccount = RawCharacter & { accountName: string };

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** 공대 이름으로 캐릭터 전체를 레벨 내림차순으로 가져옴 */
async function fetchRaidCharacters(raidQuery: string): Promise<{
  raidTitle: string;
  chars: CharWithAccount[];
} | null> {
  const supabase = getSupabase();

  const { data: raids } = await supabase
    .from("raids")
    .select("id, name, raid_name")
    .ilike("name", `%${raidQuery}%`)
    .limit(1);

  if (!raids?.length) return null;

  const raid = raids[0];
  const raidTitle = raid.raid_name
    ? `${raid.name} — ${raid.raid_name}`
    : raid.name;

  const { data: members } = await supabase
    .from("raid_members")
    .select("account_name, characters(*)")
    .eq("raid_id", raid.id);

  const chars: CharWithAccount[] = (members ?? [])
    .flatMap((m) =>
      (m.characters as RawCharacter[]).map((c) => ({
        ...c,
        accountName: m.account_name,
      }))
    )
    .sort((a, b) => Number(b.item_level) - Number(a.item_level));

  return { raidTitle, chars };
}

/** Discord embed field 1024자 제한 처리 후 addFields */
function addFieldChunks(
  embed: EmbedBuilder,
  title: string,
  lines: string[]
) {
  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    const next = current ? current + "\n" + line : line;
    if (next.length > 1020) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  chunks.forEach((chunk, i) => {
    embed.addFields({ name: i === 0 ? title : "​", value: chunk });
  });
}

// ─── /raids ─────────────────────────────────────────────────────────────────
export const raidsCommand = {
  data: new SlashCommandBuilder()
    .setName("raids")
    .setDescription("공대 목록을 출력합니다"),

  async execute(interaction: ChatInputCommandInteraction) {
    const supabase = getSupabase();
    const { data: raids } = await supabase
      .from("raids")
      .select("*")
      .order("created_at", { ascending: false });

    if (!raids?.length) {
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
              `**${i + 1}.** ${r.name}${r.raid_name ? ` — ${r.raid_name}` : ""}`
          )
          .join("\n")
      );

    await interaction.reply({ embeds: [embed] });
  },
};

// ─── /tier ──────────────────────────────────────────────────────────────────
export const tierCommand = {
  data: new SlashCommandBuilder()
    .setName("tier")
    .setDescription("공대 캐릭터의 레벨 구간 분포를 출력합니다")
    .addStringOption((opt) =>
      opt
        .setName("raid")
        .setDescription("공대 이름 (일부만 입력해도 됩니다)")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const raidQuery = interaction.options.getString("raid", true);

    const result = await fetchRaidCharacters(raidQuery);
    if (!result) {
      await interaction.editReply(`"${raidQuery}" 공대를 찾을 수 없습니다.`);
      return;
    }

    const { raidTitle, chars } = result;
    if (!chars.length) {
      await interaction.editReply(`**${raidTitle}** 공대에 등록된 캐릭터가 없습니다.`);
      return;
    }

    // 구간별 카운트
    const countMap = new Map<string, number>();
    for (const c of chars) {
      const label = getLevelTier(Number(c.item_level)).label;
      countMap.set(label, (countMap.get(label) ?? 0) + 1);
    }

    const maxCount = Math.max(...countMap.values());
    const BAR_WIDTH = 12;

    // 존재하는 구간만 출력 (순서 유지)
    const rows = LEVEL_TIERS.filter((t) => countMap.has(t.label)).map((t) => {
      const count = countMap.get(t.label)!;
      const filled = Math.round((count / maxCount) * BAR_WIDTH);
      const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
      return `\`${t.label.padEnd(10)}\` ${bar} **${count}명**`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${raidTitle}`)
      .setColor(0xf59e0b)
      .setDescription(rows.join("\n"))
      .setFooter({ text: `총 ${chars.length}명 · ${countMap.size}개 구간` });

    await interaction.editReply({ embeds: [embed] });
  },
};

// ─── /characters ────────────────────────────────────────────────────────────
export const charactersCommand = {
  data: new SlashCommandBuilder()
    .setName("characters")
    .setDescription("공대 캐릭터 목록을 레벨순으로 출력합니다")
    .addStringOption((opt) =>
      opt
        .setName("raid")
        .setDescription("공대 이름 (일부만 입력해도 됩니다)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("tier")
        .setDescription("레벨 구간 선택 (드롭다운)")
        .setRequired(false)
        .addChoices(...LEVEL_TIERS.map((t) => ({ name: t.label, value: t.label })))
    )
    .addIntegerOption((opt) =>
      opt
        .setName("min_level")
        .setDescription("최소 아이템레벨 직접 입력 (예: 1700)")
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(2000)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const raidQuery = interaction.options.getString("raid", true);
    const tierFilter = interaction.options.getString("tier");
    const minLevel = interaction.options.getInteger("min_level");

    const result = await fetchRaidCharacters(raidQuery);
    if (!result) {
      await interaction.editReply(`"${raidQuery}" 공대를 찾을 수 없습니다.`);
      return;
    }

    const { raidTitle, chars } = result;
    if (!chars.length) {
      await interaction.editReply(`**${raidTitle}** 공대에 등록된 캐릭터가 없습니다.`);
      return;
    }

    // 필터 적용 (min_level > tier 우선)
    let filtered = chars;
    let filterLabel = "";

    if (minLevel !== null) {
      filtered = chars.filter((c) => Number(c.item_level) >= minLevel);
      filterLabel = `${minLevel.toLocaleString()} 이상`;
    } else if (tierFilter) {
      filtered = chars.filter(
        (c) => getLevelTier(Number(c.item_level)).label === tierFilter
      );
      filterLabel = tierFilter;
    }

    if (!filtered.length) {
      await interaction.editReply(
        `**${raidTitle}** — \`${filterLabel}\` 구간에 해당하는 캐릭터가 없습니다.`
      );
      return;
    }

    // 구간별 그룹핑
    const grouped = new Map<string, CharWithAccount[]>();
    for (const c of filtered) {
      const label = getLevelTier(Number(c.item_level)).label;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(c);
    }

    const titleSuffix = filterLabel ? ` · ${filterLabel}` : "";
    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${raidTitle}${titleSuffix}`)
      .setColor(0xf59e0b)
      .setFooter({ text: `총 ${filtered.length}명` });

    for (const { label } of LEVEL_TIERS) {
      if (!grouped.has(label)) continue;
      const group = grouped.get(label)!;
      const lines = group.map(
        (c) =>
          `\`${String(Number(c.item_level).toFixed(2)).padStart(9)}\` **${c.character_name}** (${c.class})`
      );
      addFieldChunks(embed, `${label}  ·  ${group.length}명`, lines);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
