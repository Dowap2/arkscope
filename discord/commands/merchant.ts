/**
 * 떠돌이 상인 커맨드
 *
 * /merchant check [item] [server]  - 현재 상인 현황 확인
 * /merchant watch                  - 감시 아이템 목록 조회
 * /merchant add <item> [channel]   - 감시 아이템 등록
 * /merchant remove <item>          - 감시 아이템 삭제
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  Client,
} from "discord.js";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── 타입 ────────────────────────────────────────────────────────────────────

type MerchantItem = {
  id: string;
  name: string;
  grade: number | null; // 0=일반 1=고급 2=희귀 3=영웅 4=전설
  type: number | null;  // 1=캐릭터 2=소비 3=특수
};

type ActiveMerchant = {
  regionId: string;
  region: string;
  npcName: string;
  group: number;
  items: MerchantItem[];
  upVotes: number;
  reportedAt: string;
};

type CrawlerResult = {
  timestamp: string;
  server: number;
  slotStart: string;
  slotEnd: string;
  merchants: ActiveMerchant[];
  error?: string;
};

// ─── 감시 목록 영속화 ─────────────────────────────────────────────────────────

const WATCHES_PATH = resolve(process.cwd(), "discord/merchant-watches.json");

type WatchConfig = {
  channelId: string;
  server: number;
  items: string[];
};

function loadWatches(): WatchConfig {
  if (!existsSync(WATCHES_PATH)) return { channelId: "", server: 1, items: [] };
  try {
    return JSON.parse(readFileSync(WATCHES_PATH, "utf-8"));
  } catch {
    return { channelId: "", server: 1, items: [] };
  }
}

function saveWatches(cfg: WatchConfig) {
  writeFileSync(WATCHES_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

// ─── 크롤러 실행 ────────────────────────────────────────────────────────────

const PYTHON_SCRIPT = resolve(process.cwd(), "crawler/merchant.py");

export async function runCrawler(server = 1): Promise<CrawlerResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python", [PYTHON_SCRIPT, "--server", String(server)], {
      timeout: 30_000,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    proc.stderr.on("data", (d) => (stderr += d.toString("utf8")));

    proc.on("close", (code) => {
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error(`크롤러 출력 없음 (code ${code})\n${stderr.slice(0, 200)}`));
        return;
      }
      try {
        resolve(JSON.parse(trimmed) as CrawlerResult);
      } catch {
        reject(new Error(`JSON 파싱 실패: ${trimmed.slice(0, 200)}`));
      }
    });

    proc.on("error", reject);
  });
}

// ─── 등급 표시 ───────────────────────────────────────────────────────────────

const GRADE_EMOJI: Record<number, string> = {
  0: "⬜",
  1: "🟩",
  2: "🟦",
  3: "🟪",
  4: "🟧",
};

const SERVERS: Record<number, string> = {
  1: "루페온", 2: "실리안", 3: "아만", 4: "아브렐슈드",
  5: "카단",   6: "카마인", 7: "카제로스", 8: "엔제리카",
};

function gradeEmoji(grade: number | null): string {
  return grade != null ? (GRADE_EMOJI[grade] ?? "⬜") : "⬜";
}

function slotTimeKST(iso: string): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + 9);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── /merchant ──────────────────────────────────────────────────────────────

export const merchantCommand = {
  data: new SlashCommandBuilder()
    .setName("merchant")
    .setDescription("떠돌이 상인 현황 및 알림 관리")
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("현재 떠돌이 상인 현황을 확인합니다")
        .addStringOption((opt) =>
          opt
            .setName("item")
            .setDescription("아이템 이름 필터 (일부 입력 가능)")
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("server")
            .setDescription("서버 번호 (기본 1)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("watch").setDescription("감시 중인 아이템 목록을 봅니다")
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("감시할 아이템을 등록합니다 (상인에 뜨면 알림)")
        .addStringOption((opt) =>
          opt.setName("item").setDescription("아이템 이름").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("알림 받을 채널 (최초 1회만 설정)")
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("server")
            .setDescription("감시 서버 번호 (기본 1)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("감시 아이템을 삭제합니다")
        .addStringOption((opt) =>
          opt.setName("item").setDescription("아이템 이름").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "check")  return handleCheck(interaction);
    if (sub === "watch")  return handleWatch(interaction);
    if (sub === "add")    return handleAdd(interaction);
    if (sub === "remove") return handleRemove(interaction);
  },
};

// ─── check ──────────────────────────────────────────────────────────────────

async function handleCheck(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const filter = interaction.options.getString("item")?.toLowerCase();
  const server = interaction.options.getInteger("server") ?? 1;

  let result: CrawlerResult;
  try {
    result = await runCrawler(server);
  } catch (err) {
    await interaction.editReply(`크롤러 실행 실패: ${String(err)}`);
    return;
  }

  if (result.error) {
    await interaction.editReply(`오류: ${result.error}`);
    return;
  }

  const merchants = filter
    ? result.merchants.filter((m) =>
        m.items.some((i) => i.name.toLowerCase().includes(filter))
      )
    : result.merchants;

  if (!merchants.length) {
    const msg = filter
      ? `\`${filter}\` 아이템을 가진 상인이 없습니다.`
      : "현재 제보된 상인이 없습니다.";
    await interaction.editReply(msg);
    return;
  }

  const startKST = slotTimeKST(result.slotStart);
  const endKST   = slotTimeKST(result.slotEnd);
  const serverName = SERVERS[result.server] ?? `서버 ${result.server}`;

  // description: 지역별 2줄 (지역명+NPC / 아이템 목록)
  const lines: string[] = [];
  for (const m of merchants) {
    const visibleItems = filter
      ? m.items.filter((i) => i.name.toLowerCase().includes(filter))
      : m.items;

    const upvote = m.upVotes > 0 ? `  👍 ${m.upVotes}` : "";
    const itemStr = visibleItems
      .map((i) => `${gradeEmoji(i.grade)} ${i.name}`)
      .join("  ");

    lines.push(`**${m.region}** · ${m.npcName}${upvote}`);
    lines.push(itemStr || "—");
    lines.push("");
  }

  // 4096자 초과 방지
  let description = lines.join("\n");
  if (description.length > 4000) {
    description = description.slice(0, 4000) + "\n…";
  }

  const embed = new EmbedBuilder()
    .setTitle(`🧭 떠돌이 상인  ·  ${serverName}`)
    .setColor(0x10b981)
    .setDescription(description)
    .setFooter({
      text: `슬롯  ${startKST} ~ ${endKST} KST  ·  ${merchants.length}개 지역  ·  kloa.gg`,
    })
    .setTimestamp(new Date(result.timestamp));

  await interaction.editReply({ embeds: [embed] });
}

// ─── watch ──────────────────────────────────────────────────────────────────

async function handleWatch(interaction: ChatInputCommandInteraction) {
  const cfg = loadWatches();
  const channelMention = cfg.channelId
    ? `<#${cfg.channelId}>`
    : "미설정 (/merchant add 시 channel 지정)";

  const embed = new EmbedBuilder()
    .setTitle("📋 감시 아이템 목록")
    .setColor(0x6366f1)
    .addFields(
      { name: "알림 채널",  value: channelMention,                                          inline: true },
      { name: "서버",       value: `서버 ${cfg.server}`,                                    inline: true },
      {
        name: "감시 중",
        value: cfg.items.length ? cfg.items.map((i) => `• ${i}`).join("\n") : "없음",
        inline: false,
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ─── add ────────────────────────────────────────────────────────────────────

async function handleAdd(interaction: ChatInputCommandInteraction) {
  const item    = interaction.options.getString("item", true).trim();
  const channel = interaction.options.getChannel("channel") as TextChannel | null;
  const server  = interaction.options.getInteger("server");

  const cfg = loadWatches();

  if (channel) cfg.channelId = channel.id;
  if (server)  cfg.server = server;

  if (!cfg.items.includes(item)) {
    cfg.items.push(item);
    saveWatches(cfg);
    await interaction.reply({
      content: `✅ **${item}** 감시 등록 완료${channel ? ` → <#${channel.id}>` : ""}`,
      ephemeral: true,
    });
  } else {
    saveWatches(cfg); // channel/server 업데이트만
    await interaction.reply({
      content: `이미 감시 중인 아이템입니다: **${item}**`,
      ephemeral: true,
    });
  }
}

// ─── remove ─────────────────────────────────────────────────────────────────

async function handleRemove(interaction: ChatInputCommandInteraction) {
  const item = interaction.options.getString("item", true).trim();
  const cfg  = loadWatches();

  const idx = cfg.items.indexOf(item);
  if (idx === -1) {
    await interaction.reply({
      content: `감시 목록에 없는 아이템: **${item}**`,
      ephemeral: true,
    });
    return;
  }

  cfg.items.splice(idx, 1);
  saveWatches(cfg);
  await interaction.reply({ content: `🗑️ **${item}** 감시 삭제 완료`, ephemeral: true });
}

// ─── 백그라운드 폴러 ─────────────────────────────────────────────────────────

// 슬롯 전환 시각 (KST) — 이 시각 직후에 크롤러 실행
const SLOT_TIMES_KST = [
  { h: 10, m: 30 },
  { h: 16, m: 30 },
  { h: 22, m: 30 },
];

/** 다음 슬롯 전환까지 남은 ms 반환 (30초 버퍼 포함) */
function msUntilNextSlot(): number {
  const nowUtc = Date.now();
  const nowKST = new Date(nowUtc + 9 * 60 * 60 * 1000);

  const candidates: number[] = SLOT_TIMES_KST.map(({ h, m }) => {
    const t = new Date(nowKST);
    t.setUTCHours(h, m, 30, 0); // 30초 버퍼
    return t.getTime() - nowKST.getTime(); // KST 기준 delta
  });

  const next = candidates.find((ms) => ms > 0) ?? candidates[0] + 24 * 60 * 60 * 1000;
  return next;
}

export function startMerchantPoller(client: Client) {
  const times = SLOT_TIMES_KST.map(({ h, m }) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  ).join(", ");
  console.log(`🧭 상인 폴러 시작 (KST ${times} 실행)`);

  async function poll() {
    const cfg = loadWatches();
    if (!cfg.items.length || !cfg.channelId) return;

    let result: CrawlerResult;
    try {
      result = await runCrawler(cfg.server);
    } catch (err) {
      console.error("[merchant] 크롤러 오류:", err);
      return;
    }

    if (result.error) return;

    // 감시 아이템 매칭
    const found: Array<{ item: string; region: string; itemName: string; grade: number | null }> = [];
    for (const watchItem of cfg.items) {
      const lower = watchItem.toLowerCase();
      for (const m of result.merchants) {
        for (const i of m.items.filter((i) => i.name.toLowerCase().includes(lower))) {
          found.push({ item: watchItem, region: m.region, itemName: i.name, grade: i.grade });
        }
      }
    }

    if (!found.length) return;

    const channel = await client.channels.fetch(cfg.channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const serverName = SERVERS[result.server] ?? `서버 ${result.server}`;
    const startKST = slotTimeKST(result.slotStart);
    const endKST   = slotTimeKST(result.slotEnd);

    const embed = new EmbedBuilder()
      .setTitle("🔔 떠돌이 상인 아이템 발견!")
      .setColor(0xf59e0b)
      .setTimestamp()
      .setDescription(found.map((f) => `${gradeEmoji(f.grade)} **${f.itemName}** — ${f.region}`).join("\n"))
      .setFooter({ text: `${serverName} · 슬롯 ${startKST}~${endKST} KST · kloa.gg` });

    await (channel as TextChannel).send({ embeds: [embed] });
  }

  function schedule() {
    const ms = msUntilNextSlot();
    const nextKST = new Date(Date.now() + ms);
    // KST 표시용
    const kstDate = new Date(nextKST.getTime() + 9 * 60 * 60 * 1000);
    console.log(
      `🧭 다음 상인 체크: ${kstDate.toISOString().slice(11, 16)} KST (${Math.round(ms / 60_000)}분 후)`
    );

    setTimeout(async () => {
      await poll();
      schedule(); // 다음 슬롯 예약
    }, ms);
  }

  schedule();
}
