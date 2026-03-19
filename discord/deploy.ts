/**
 * Discord 슬래시 커맨드 등록 스크립트
 * 커맨드 추가/수정 후 한 번만 실행하면 됩니다.
 *
 * 실행: npm run discord:deploy
 */

import { REST, Routes } from "discord.js";
import { raidsCommand, charactersCommand } from "./commands/raids.js";
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
  } catch {}
}

loadEnv();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID; // 개발 중에는 특정 서버에만 등록 (즉시 반영)

if (!token || !clientId) {
  throw new Error(
    "DISCORD_TOKEN 또는 DISCORD_CLIENT_ID가 설정되지 않았습니다.",
  );
}

const commands = [raidsCommand.data.toJSON(), charactersCommand.data.toJSON()];

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`커맨드 ${commands.length}개 등록 중...`);

    if (guildId) {
      // 특정 서버에만 등록 (개발용, 즉시 반영)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`✅ 길드(${guildId}) 커맨드 등록 완료`);
    } else {
      // 전체 글로벌 등록 (최대 1시간 소요)
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("✅ 글로벌 커맨드 등록 완료");
    }
  } catch (err) {
    console.error(err);
  }
})();
