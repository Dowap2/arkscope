import { CharacterArmory, ArmoryEquipment, ArmorySkill } from "@/types";
import { getLevelTier } from "@/lib/level";
import Image from "next/image";

/* ─── 유틸 ─────────────────────────────────────────────── */

function parseLevel(raw: string) {
  return parseFloat(raw.replace(/,/g, ""));
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").trim();
}

function extractUpgradeLevel(name: string): number | null {
  const m = stripHtml(name).match(/^\+(\d+)/);
  return m ? parseInt(m[1]) : null;
}

/* ─── 색상 ──────────────────────────────────────────────── */

function gradeColor(grade: string) {
  if (grade === "고대")   return { text: "text-yellow-200",  border: "border-yellow-200/40",  bg: "bg-yellow-200/5" };
  if (grade === "유물")   return { text: "text-orange-400",  border: "border-orange-400/40",  bg: "bg-orange-400/5" };
  if (grade === "전설")   return { text: "text-amber-400",   border: "border-amber-400/40",   bg: "bg-amber-400/5" };
  if (grade === "영웅")   return { text: "text-purple-400",  border: "border-purple-400/40",  bg: "bg-purple-400/5" };
  if (grade === "희귀")   return { text: "text-blue-400",    border: "border-blue-400/40",    bg: "bg-blue-400/5" };
  return { text: "text-slate-300", border: "border-slate-600", bg: "bg-slate-800" };
}

function qualityColor(q: number) {
  if (q >= 90) return "text-teal-400";
  if (q >= 70) return "text-green-400";
  if (q >= 50) return "text-yellow-400";
  return "text-red-400";
}

function engravingLevelColor(lv: number) {
  if (lv >= 3) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
  if (lv === 2) return "text-slate-200 border-slate-500/40 bg-slate-500/10";
  return "text-slate-400 border-slate-700 bg-slate-800";
}

function gemTypeColor(name: string) {
  if (name.includes("겁화"))  return "text-red-400    bg-red-500/10    border-red-500/30";
  if (name.includes("멸화"))  return "text-orange-400 bg-orange-500/10 border-orange-500/30";
  if (name.includes("홍염"))  return "text-rose-400   bg-rose-500/10   border-rose-500/30";
  if (name.includes("작열"))  return "text-amber-400  bg-amber-500/10  border-amber-500/30";
  if (name.includes("광휘"))  return "text-sky-300    bg-sky-500/10    border-sky-500/30";
  return "text-blue-400 bg-blue-500/10 border-blue-500/30";
}

function runeGradeColor(grade: string) {
  if (grade === "전설") return "text-amber-400";
  if (grade === "영웅") return "text-purple-400";
  if (grade === "희귀") return "text-blue-400";
  return "text-slate-400";
}

/* ─── Tooltip 파싱 ──────────────────────────────────────── */

const STAT_LABELS = ["연마 효과", "팔찌 효과", "특수 효과", "추가 효과", "전투 특성"];

type ParsedTooltip = {
  quality: number | null;
  stats: string[];
  positiveEngravings: string[];
  negativeEngravings: string[];
};

function parseTooltip(tooltipStr: string): ParsedTooltip {
  const result: ParsedTooltip = {
    quality: null,
    stats: [],
    positiveEngravings: [],
    negativeEngravings: [],
  };
  try {
    const tooltip = JSON.parse(tooltipStr);
    for (const key of Object.keys(tooltip)) {
      const el = tooltip[key];
      if (!el?.type || !el?.value) continue;

      if (el.type === "ItemTitle") {
        const q = el.value?.qualityValue;
        if (typeof q === "number" && q >= 0) result.quality = q;
        continue;
      }

      if (el.type === "ItemPartBox") {
        const labelRaw: string = el.value?.Element_000 ?? "";
        const content:  string = el.value?.Element_001 ?? "";
        if (!labelRaw || !content) continue;
        const label = stripHtml(labelRaw);
        if (STAT_LABELS.some((l) => label.includes(l))) {
          result.stats.push(
            ...content.split(/<br\s*\/?>/gi).map(stripHtml).filter(Boolean)
          );
        }
        continue;
      }

      if (el.type === "IndentStringGroup") {
        const group = el.value?.Element_000;
        if (!group) continue;
        const topStr = stripHtml(group.topStr ?? "");
        if (!topStr.includes("각인") && !topStr.includes("무작위")) continue;
        const contentStr = group.contentStr ?? {};
        for (const ek of Object.keys(contentStr)) {
          const entry = contentStr[ek];
          if (typeof entry?.contentStr !== "string") continue;
          const clean = stripHtml(entry.contentStr);
          if (!clean) continue;
          if (entry.bPoint) result.positiveEngravings.push(clean);
          else              result.negativeEngravings.push(clean);
        }
      }
    }
  } catch { /* ignore */ }
  return result;
}

/* ─── 상수 ──────────────────────────────────────────────── */

const ARMOR_ORDER      = ["무기", "투구", "상의", "하의", "장갑", "어깨"];
const ACCESSORY_ORDER  = ["목걸이", "귀걸이", "반지", "팔찌", "어빌리티 스톤"];

/* ─── 컴포넌트: 장비 카드 (무기/방어구) ─────────────────── */

function EquipmentCard({ item }: { item: ArmoryEquipment }) {
  const grade   = gradeColor(item.Grade);
  const parsed  = parseTooltip(item.Tooltip);
  const upgrade = extractUpgradeLevel(item.Name);
  const cleanName = stripHtml(item.Name).replace(/^\+\d+\s*/, "");

  return (
    <div className={`rounded-lg border ${grade.border} ${grade.bg} p-3 flex gap-3`}>
      {item.Icon && (
        <div className={`flex-shrink-0 w-10 h-10 rounded border ${grade.border} overflow-hidden bg-slate-900 relative`}>
          <Image src={item.Icon} alt={item.Name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500">{item.Type}</span>
          {upgrade !== null && (
            <span className="text-xs font-bold text-slate-300">+{upgrade}</span>
          )}
          {parsed.quality !== null && (
            <span className={`text-xs font-bold ${qualityColor(parsed.quality)}`}>
              품질 {parsed.quality}
            </span>
          )}
        </div>
        <p className={`text-sm font-medium leading-tight mt-0.5 ${grade.text}`}>{cleanName}</p>
        {parsed.stats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {parsed.stats.map((s, i) => (
              <span key={i} className="text-xs text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 컴포넌트: 악세서리 카드 ───────────────────────────── */

function AccessoryCard({ item }: { item: ArmoryEquipment }) {
  const grade  = gradeColor(item.Grade);
  const parsed = parseTooltip(item.Tooltip);

  return (
    <div className={`rounded-lg border ${grade.border} ${grade.bg} p-3 flex gap-3`}>
      {item.Icon && (
        <div className={`flex-shrink-0 w-10 h-10 rounded border ${grade.border} overflow-hidden bg-slate-900 relative`}>
          <Image src={item.Icon} alt={item.Name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500">{item.Type}</span>
          {parsed.quality !== null && (
            <span className={`text-xs font-bold ${qualityColor(parsed.quality)}`}>
              품질 {parsed.quality}
            </span>
          )}
        </div>
        <p className={`text-sm font-medium leading-tight mt-0.5 ${grade.text}`}>{stripHtml(item.Name)}</p>
        {parsed.stats.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {parsed.stats.map((s, i) => (
              <span key={i} className="text-xs text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
        )}
        {(parsed.positiveEngravings.length > 0 || parsed.negativeEngravings.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {parsed.positiveEngravings.map((e, i) => (
              <span key={i} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">+{e}</span>
            ))}
            {parsed.negativeEngravings.map((e, i) => (
              <span key={i} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">-{e}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 컴포넌트: 스킬 카드 ───────────────────────────────── */

function SkillCard({ skill }: { skill: ArmorySkill }) {
  const selectedTripods = skill.Tripods?.filter((t) => t.IsSelected) ?? [];

  return (
    <div className="rounded-lg bg-slate-700/40 border border-slate-700 p-3 flex gap-3">
      {skill.Icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded border border-slate-600 overflow-hidden bg-slate-900 relative">
          <Image src={skill.Icon} alt={skill.Name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-slate-200">{skill.Name}</span>
          {skill.Level > 1 && (
            <span className="text-xs text-slate-400">Lv.{skill.Level}</span>
          )}
          {skill.IsAwakening && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">각성</span>
          )}
          {skill.Rune && (
            <span className={`text-xs px-1.5 py-0.5 rounded border border-current/20 ${runeGradeColor(skill.Rune.Grade)}`}>
              {skill.Rune.Name}
            </span>
          )}
        </div>
        {selectedTripods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedTripods.map((t, i) => (
              <span key={i} className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                {t.Name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 메인 뷰 ───────────────────────────────────────────── */

export default function ArmoryView({ armory }: { armory: CharacterArmory }) {
  const profile    = armory.ArmoryProfile;
  const engraveData = armory.ArmoryEngraving;
  const gemData    = armory.ArmoryGem;
  const equipment  = armory.ArmoryEquipment ?? [];
  const cardData   = armory.ArmoryCard;
  const skillData  = armory.ArmorySkill ?? [];

  if (!profile) return <p className="text-slate-400 text-sm">프로필 정보 없음</p>;

  const itemLevel = parseLevel(profile.ItemAvgLevel);
  const tier      = getLevelTier(itemLevel);

  // 각인
  const arkPassiveEffects = Array.isArray(engraveData?.ArkPassiveEffects) ? engraveData.ArkPassiveEffects : [];
  const legacyEffects     = Array.isArray(engraveData?.Effects)           ? engraveData.Effects           : [];

  // 보석
  const gems      = Array.isArray(gemData?.Gems)   ? gemData.Gems   : [];
  const gemSkills = gemData?.Effects?.Skills ?? [];
  const gemsWithEffect = gems
    .map((g) => ({ ...g, skill: gemSkills.find((s) => s.GemSlot === g.Slot) }))
    .sort((a, b) => b.Level - a.Level);

  // 장비 분류
  const armorPieces   = equipment
    .filter((e) => ARMOR_ORDER.includes(e.Type))
    .sort((a, b) => ARMOR_ORDER.indexOf(a.Type) - ARMOR_ORDER.indexOf(b.Type));
  const accessories = equipment
    .filter((e) => ACCESSORY_ORDER.includes(e.Type))
    .sort((a, b) => ACCESSORY_ORDER.indexOf(a.Type) - ACCESSORY_ORDER.indexOf(b.Type));

  // 카드 세트 효과 (활성화된 것만)
  const cardEffects = (cardData?.Effects ?? []).filter((ef) => ef.Items.length > 0);

  // 스킬: 레벨이 있거나 트라이포드 선택된 것
  const activeSkills = skillData.filter(
    (s) => s.Level > 1 || s.Tripods?.some((t) => t.IsSelected) || s.IsAwakening
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── 프로필 ── */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5 flex gap-5">
        {profile.CharacterImage && (
          <div className="flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden bg-slate-700 relative">
            <Image src={profile.CharacterImage} alt={profile.CharacterName} fill className="object-cover object-top" unoptimized />
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
            <span className={`text-lg font-bold ${tier.color}`}>{profile.ItemAvgLevel}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${tier.color} ${tier.bg}`}>{tier.label}</span>
          </div>
          <div className="flex gap-3 mt-1 flex-wrap">
            {profile.GuildName && <span className="text-xs text-slate-400">⚔ {profile.GuildName}</span>}
            <span className="text-xs text-slate-400">원정대 Lv. {profile.ExpeditionLevel}</span>
          </div>
        </div>
      </div>

      {/* ── 전투 스탯 ── */}
      {profile.Stats && profile.Stats.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">전투 스탯</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {profile.Stats.filter((s) => ["치명", "특화", "제압", "신속", "인내", "숙련"].includes(s.Type)).map((s) => (
              <div key={s.Type} className="flex flex-col items-center rounded-lg bg-slate-700/50 px-3 py-2 gap-0.5">
                <span className="text-xs text-slate-400">{s.Type}</span>
                <span className="text-sm font-semibold text-white">{s.Value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 무기/방어구 ── */}
      {armorPieces.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            무기 · 방어구 <span className="text-slate-500 font-normal">{armorPieces.length}개</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {armorPieces.map((item, i) => <EquipmentCard key={i} item={item} />)}
          </div>
        </div>
      )}

      {/* ── 악세서리 ── */}
      {accessories.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            악세서리 <span className="text-slate-500 font-normal">{accessories.length}개</span>
          </h2>
          <div className="flex flex-col gap-2">
            {accessories.map((item, i) => <AccessoryCard key={i} item={item} />)}
          </div>
        </div>
      )}

      {/* ── 각인 ── */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">장착 각인</h2>
        {arkPassiveEffects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {arkPassiveEffects.map((e, i) => (
              <div key={i} className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-medium ${engravingLevelColor(e.Level)}`}>
                <span>{e.Name} Lv.{e.Level}</span>
                {e.Description && (
                  <span className="text-xs opacity-70 font-normal mt-0.5 max-w-52 leading-tight">{stripHtml(e.Description)}</span>
                )}
              </div>
            ))}
          </div>
        ) : legacyEffects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {legacyEffects.map((e, i) => {
              const m   = e.Name.match(/Lv\.(\d)/);
              const lv  = m ? parseInt(m[1]) : 0;
              return (
                <div key={i} className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-medium ${engravingLevelColor(lv)}`}>
                  <span>{e.Name}</span>
                  {e.Description && <span className="text-xs opacity-70 font-normal mt-0.5 max-w-52 leading-tight">{e.Description}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">각인 정보 없음</p>
        )}
      </div>

      {/* ── 보석 ── */}
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">
          보석 <span className="text-slate-500 font-normal">{gems.length}개</span>
        </h2>
        {gems.length === 0 ? (
          <p className="text-sm text-slate-500">보석 정보 없음</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {gemsWithEffect.map((g) => {
              const cleanName = stripHtml(g.Name);
              const typeStyle = gemTypeColor(cleanName);
              const desc = g.skill?.Description
                ? (Array.isArray(g.skill.Description) ? g.skill.Description.join(" ") : String(g.skill.Description))
                : null;
              return (
                <div key={g.Slot} className="flex gap-2.5 rounded-lg bg-slate-700/40 border border-slate-700 px-3 py-2.5">
                  {g.Icon && (
                    <Image src={g.Icon} alt={cleanName} width={32} height={32} className="rounded flex-shrink-0 self-start mt-0.5" unoptimized />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${typeStyle}`}>{cleanName}</span>
                      {g.skill?.Name && <span className="text-xs text-slate-300 font-medium">{g.skill.Name}</span>}
                    </div>
                    {desc && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 카드 세트 ── */}
      {cardEffects.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">카드 세트 효과</h2>
          <div className="flex flex-col gap-3">
            {cardEffects.map((ef, i) => (
              <div key={i} className="flex flex-col gap-1">
                {ef.Items.map((item, j) => (
                  <div key={j} className="flex gap-2 items-start">
                    <span className="text-xs text-amber-400 font-medium shrink-0 mt-0.5">{item.Name}</span>
                    <span className="text-xs text-slate-400 leading-relaxed">{stripHtml(item.Description)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 스킬 ── */}
      {activeSkills.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            스킬 <span className="text-slate-500 font-normal">{activeSkills.length}개</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeSkills.map((s, i) => <SkillCard key={i} skill={s} />)}
          </div>
        </div>
      )}

    </div>
  );
}
