import { CharacterArmory } from "@/types";
import { getLevelTier } from "@/lib/level";
import Image from "next/image";

function parseLevel(raw: string) {
  return parseFloat(raw.replace(/,/g, ""));
}

// 각인 레벨 추출 (이름에서 "Lv.N" 파싱)
function parseEngravingLevel(name: string): number {
  const m = name.match(/Lv\.(\d)/);
  return m ? parseInt(m[1]) : 0;
}

function engravingLevelColor(lv: number) {
  if (lv >= 3) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  if (lv === 2) return "text-slate-200 border-slate-500/40 bg-slate-500/10";
  return "text-slate-400 border-slate-700 bg-slate-800";
}

// 보석 타입 색상
function gemColor(effectType: string) {
  if (effectType === "겁화") return "text-red-400";
  if (effectType === "멸화") return "text-orange-400";
  if (effectType === "홍염") return "text-rose-400";
  if (effectType === "작열") return "text-amber-400";
  return "text-blue-400";
}

export default function ArmoryView({ armory }: { armory: CharacterArmory }) {
  const profile = armory.ArmoryProfile;
  const engrave = armory.ArmoryEngrave;
  const gemData = armory.ArmoryGem;

  if (!profile) return <p className="text-slate-400 text-sm">프로필 정보 없음</p>;

  const itemLevel = parseLevel(profile.ItemAvgLevel);
  const tier = getLevelTier(itemLevel);

  const effects = Array.isArray(engrave?.Effects) ? engrave.Effects : [];
  const gems = Array.isArray(gemData?.Gems) ? gemData.Gems : [];
  const gemEffects = Array.isArray(gemData?.Effects) ? gemData.Effects : [];

  // 보석에 효과 매핑
  const gemsWithEffect = gems.map((g) => ({
    ...g,
    effect: gemEffects.find((e) => e.GemSlot === g.Slot),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* 프로필 헤더 */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 flex gap-5">
        {profile.CharacterImage && (
          <div className="flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-slate-700 relative">
            <Image
              src={profile.CharacterImage}
              alt={profile.CharacterName}
              fill
              className="object-cover object-top"
              unoptimized
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{profile.CharacterName}</h1>
            <span className="text-sm text-slate-400">@{profile.ServerName}</span>
          </div>
          <p className="text-sm text-slate-300">{profile.CharacterClassName}</p>
          <p className="text-xs text-slate-500">Lv. {profile.CharacterLevel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-bold ${tier.color}`}>
              {profile.ItemAvgLevel}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.color} ${tier.bg}`}>
              {tier.label}
            </span>
          </div>
          <div className="flex gap-3 mt-1 flex-wrap">
            {profile.GuildName && (
              <span className="text-xs text-slate-400">⚔ {profile.GuildName}</span>
            )}
            <span className="text-xs text-slate-400">
              원정대 Lv. {profile.ExpeditionLevel}
            </span>
          </div>
        </div>
      </div>

      {/* 각인 */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">장착 각인</h2>
        {effects.length === 0 ? (
          <p className="text-sm text-slate-500">각인 정보 없음</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {effects.map((e, i) => {
              const lv = parseEngravingLevel(e.Name);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${engravingLevelColor(lv)}`}
                >
                  <span>{e.Name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 보석 */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          보석{" "}
          <span className="text-slate-500 font-normal">{gems.length}개</span>
        </h2>
        {gems.length === 0 ? (
          <p className="text-sm text-slate-500">보석 정보 없음</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gemsWithEffect
              .sort((a, b) => b.Level - a.Level)
              .map((g) => (
                <div
                  key={g.Slot}
                  className="flex items-center gap-2.5 rounded-lg bg-slate-700/50 border border-slate-700 px-3 py-2"
                >
                  {g.Icon && (
                    <Image
                      src={g.Icon}
                      alt={g.Name}
                      width={28}
                      height={28}
                      className="rounded flex-shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${gemColor(g.EffectType)}`}>
                        {g.EffectType} {g.Level}레벨
                      </span>
                    </div>
                    {g.effect && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {g.effect.Description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 스탯 */}
      {profile.Stats && profile.Stats.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">전투 스탯</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {profile.Stats.filter((s) =>
              ["치명", "특화", "제압", "신속", "인내", "숙련"].includes(s.Type)
            ).map((s) => (
              <div
                key={s.Type}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 px-3 py-2"
              >
                <span className="text-xs text-slate-400">{s.Type}</span>
                <span className="text-sm font-semibold text-white">{s.Value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
