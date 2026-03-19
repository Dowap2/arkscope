/**
 * ArkScope Discord Bot
 * 실행: npm run discord:bot
 */

import { Client, GatewayIntentBits, Events, Collection, ChatInputCommandInteraction } from "discord.js";
import { raidsCommand, charactersCommand } from "./commands/raids.js";

type Command = {
  data: { name: string; toJSON?: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

// dotenv (tsx가 자동으로 .env.local을 로드하지 않으므로 직접 로드)
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && !process.env[key]) {
        process.env[key] = rest.join("=");
      }
    }
  } catch {
    // .env.local 없을 경우 무시
  }
}

loadEnv();

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN이 설정되지 않았습니다.");

// 커맨드 등록
const commands = new Collection<string, Command>();
commands.set(raidsCommand.data.name, raidsCommand);
commands.set(charactersCommand.data.name, charactersCommand);

// 클라이언트 생성
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`✅ ${c.user.tag} 로그인 완료`);
  console.log(`등록된 커맨드: ${[...commands.keys()].map((k) => `/${k}`).join(", ")}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`커맨드 오류 (${interaction.commandName}):`, err);
    const msg = { content: "오류가 발생했습니다.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(token);
