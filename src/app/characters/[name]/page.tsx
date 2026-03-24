import { notFound } from "next/navigation";
import Link from "next/link";
import { getCharacterArmory } from "@/lib/lostark/api";
import ArmoryView from "@/components/character/ArmoryView";
import { getLevelTier } from "@/lib/level";

export const dynamic = "force-dynamic";

function parseLevel(raw: string) {
  return parseFloat(raw.replace(/,/g, ""));
}

export default async function CharacterPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { name } = await params;
  const { from } = await searchParams;
  const characterName = decodeURIComponent(name);

  let armory;
  try {
    armory = await getCharacterArmory(characterName);
  } catch {
    notFound();
  }

  const profile = armory.ArmoryProfile;
  const itemLevel = profile ? parseLevel(profile.ItemAvgLevel) : 0;
  const tier = getLevelTier(itemLevel);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* ── 상단 고정 헤더 ── */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Row 1: 뒤로 + 이름 + 서버 + 직업 */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={from ? `/raids/${from}` : "/"}
              className="text-slate-400 hover:text-white transition-colors text-sm shrink-0"
            >
              ← 뒤로
            </Link>
            <span className="text-slate-700 shrink-0">|</span>
            <h1 className="text-base font-bold text-white truncate">
              {profile?.CharacterName ?? characterName}
            </h1>
            {profile && (
              <>
                <span className="text-slate-400 text-sm shrink-0">
                  @{profile.ServerName}
                </span>
                <span className="text-xs bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded shrink-0">
                  {profile.CharacterClassName}
                </span>
              </>
            )}
          </div>

          {/* Row 2: 전투력 + 레벨 정보 */}
          {profile && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`text-sm font-bold ${tier.color}`}>
                {profile.ItemAvgLevel}
              </span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs text-slate-400">
                전투 <span className="text-slate-300 font-medium">{profile.CharacterLevel}</span>
              </span>
              <span className="text-xs text-slate-400">
                원정대 <span className="text-slate-300 font-medium">{profile.ExpeditionLevel}</span>
              </span>
              {profile.TownLevel != null && (
                <span className="text-xs text-slate-400">
                  영지 <span className="text-slate-300 font-medium">{profile.TownLevel}</span>
                </span>
              )}
              {profile.GuildName && (
                <span className="text-xs text-slate-400">
                  ⚔ <span className="text-slate-300">{profile.GuildName}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        <ArmoryView armory={armory} />
      </main>
    </div>
  );
}
