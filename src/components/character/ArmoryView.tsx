"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CharacterArmory, ArmoryEquipment, ArmorySkill } from "@/types";
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

const ARMOR_ORDER     = ["무기", "투구", "상의", "하의", "장갑", "어깨"];
const ACCESSORY_ORDER = ["목걸이", "귀걸이", "반지", "팔찌", "어빌리티 스톤"];

/* ─── 장비 카드 ─────────────────────────────────────────── */

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

/* ─── 악세서리 카드 ─────────────────────────────────────── */

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

/* ─── 툴팁 ──────────────────────────────────────────────── */

function Tooltip({
  content,
  label,
  children,
}: {
  content: string;
  label?: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-64 bg-slate-950 border border-slate-600 rounded-lg p-3 shadow-2xl pointer-events-none">
          {label && <p className="text-xs text-slate-500 mb-1.5">{label}</p>}
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      )}
    </div>
  );
}

/* ─── 스킬 카드 ─────────────────────────────────────────── */

function SkillCard({ skill }: { skill: ArmorySkill }) {
  const tripodsByTier = ([0, 1, 2] as const).map(
    (tier) => skill.Tripods?.find((t) => t.Tier === tier && t.IsSelected) ?? null
  );
  const hasAnyTripod = tripodsByTier.some((t) => t !== null);
  const isSpecial = skill.IsAwakening || skill.SkillType !== 0;
  const skillDesc = skill.Tooltip ? stripHtml(skill.Tooltip) : null;

  return (
    <div
      className={`rounded-xl border flex flex-col ${
        isSpecial ? "bg-amber-500/5 border-amber-500/30" : "bg-slate-800 border-slate-700"
      }`}
    >
      {/* 상단 */}
      <div className="p-4 flex gap-3">
        {/* 스킬 아이콘 + 설명 툴팁 */}
        {skillDesc ? (
          <Tooltip content={skillDesc}>
            <div
              className={`w-12 h-12 rounded-lg border overflow-hidden bg-slate-900 relative cursor-default flex-shrink-0 ${
                isSpecial ? "border-amber-500/50" : "border-slate-600"
              }`}
            >
              {skill.Icon && (
                <Image src={skill.Icon} alt={skill.Name} fill className="object-cover" unoptimized />
              )}
            </div>
          </Tooltip>
        ) : (
          <div
            className={`w-12 h-12 rounded-lg border overflow-hidden bg-slate-900 relative flex-shrink-0 ${
              isSpecial ? "border-amber-500/50" : "border-slate-600"
            }`}
          >
            {skill.Icon && (
              <Image src={skill.Icon} alt={skill.Name} fill className="object-cover" unoptimized />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-white">{skill.Name}</span>
            {skill.Level > 1 && (
              <span className="text-xs text-slate-400 font-mono">Lv.{skill.Level}</span>
            )}
            {isSpecial && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                {skill.IsAwakening ? "각성" : "특수"}
              </span>
            )}
          </div>
          {skill.Type && (
            <span className="mt-1 inline-block text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
              {skill.Type}
            </span>
          )}
        </div>

        {/* 룬 */}
        {skill.Rune && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1 min-w-[40px]">
            {skill.Rune.Icon && (
              <div className="w-8 h-8 rounded border border-slate-600 overflow-hidden bg-slate-900 relative">
                <Image
                  src={skill.Rune.Icon}
                  alt={skill.Rune.Name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <span className={`text-xs font-medium leading-tight text-center ${runeGradeColor(skill.Rune.Grade)}`}>
              {skill.Rune.Name}
            </span>
          </div>
        )}
      </div>

      {/* 트라이포드 */}
      {hasAnyTripod && (
        <div className="border-t border-slate-700/60 px-4 py-2.5 flex gap-2 flex-wrap">
          {tripodsByTier.map((tripod, idx) =>
            tripod ? (
              <Tooltip
                key={idx}
                content={tripod.Tooltip ? stripHtml(tripod.Tooltip) : ""}
                label={`티어 ${idx + 1} · ${tripod.Name}`}
              >
                <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 rounded px-2 py-1 cursor-default">
                  <span className="text-xs text-sky-700 font-mono leading-none select-none">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-sky-300 font-medium">{tripod.Name}</span>
                </div>
              </Tooltip>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

/* ─── 탭 정의 ───────────────────────────────────────────── */

const TABS = ["전투", "스킬", "아크패시브", "내실", "아바타", "통계", "캐릭터"] as const;
type Tab = (typeof TABS)[number];

/* ─── 준비 중 플레이스홀더 ──────────────────────────────── */

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
      <span className="text-4xl mb-3">🔒</span>
      <p className="text-sm">{label} 탭은 준비 중입니다.</p>
    </div>
  );
}

/* ─── 전투 탭 ───────────────────────────────────────────── */

function BattleTab({ armory }: { armory: CharacterArmory }) {
  const profile   = armory.ArmoryProfile;
  const equipment = armory.ArmoryEquipment ?? [];
  const gemData   = armory.ArmoryGem;
  const cardData  = armory.ArmoryCard;

  const armorPieces = equipment
    .filter((e) => ARMOR_ORDER.includes(e.Type))
    .sort((a, b) => ARMOR_ORDER.indexOf(a.Type) - ARMOR_ORDER.indexOf(b.Type));

  const accessories = equipment
    .filter((e) => ACCESSORY_ORDER.includes(e.Type))
    .sort((a, b) => ACCESSORY_ORDER.indexOf(a.Type) - ACCESSORY_ORDER.indexOf(b.Type));

  const gems = Array.isArray(gemData?.Gems) ? gemData.Gems : [];
  const gemSkills = gemData?.Effects?.Skills ?? [];
  const gemsWithEffect = gems
    .map((g) => ({ ...g, skill: gemSkills.find((s) => s.GemSlot === g.Slot) }))
    .sort((a, b) => b.Level - a.Level);

  const cardEffects = (cardData?.Effects ?? []).filter((ef) => ef.Items.length > 0);

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* 전투 스탯 */}
      {profile?.Stats && profile.Stats.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">전투 스탯</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {profile.Stats.filter((s) =>
              ["치명", "특화", "제압", "신속", "인내", "숙련"].includes(s.Type)
            ).map((s) => (
              <div key={s.Type} className="flex flex-col items-center rounded-lg bg-slate-700/50 px-3 py-2 gap-0.5">
                <span className="text-xs text-slate-400">{s.Type}</span>
                <span className="text-sm font-semibold text-white">{s.Value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 무기/방어구 */}
      {armorPieces.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            무기 · 방어구{" "}
            <span className="text-slate-500 font-normal">{armorPieces.length}개</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {armorPieces.map((item, i) => (
              <EquipmentCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 악세서리 */}
      {accessories.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            악세서리{" "}
            <span className="text-slate-500 font-normal">{accessories.length}개</span>
          </h2>
          <div className="flex flex-col gap-2">
            {accessories.map((item, i) => (
              <AccessoryCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

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
            {gemsWithEffect.map((g) => {
              const cleanName = stripHtml(g.Name);
              const typeStyle = gemTypeColor(cleanName);
              const desc = g.skill?.Description
                ? Array.isArray(g.skill.Description)
                  ? g.skill.Description.join(" ")
                  : String(g.skill.Description)
                : null;
              return (
                <div
                  key={g.Slot}
                  className="flex gap-2.5 rounded-lg bg-slate-700/40 border border-slate-700 px-3 py-2.5"
                >
                  {g.Icon && (
                    <Image
                      src={g.Icon}
                      alt={cleanName}
                      width={32}
                      height={32}
                      className="rounded flex-shrink-0 self-start mt-0.5"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${typeStyle}`}>
                        {cleanName}
                      </span>
                      {g.skill?.Name && (
                        <span className="text-xs text-slate-300 font-medium">{g.skill.Name}</span>
                      )}
                    </div>
                    {desc && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 카드 세트 */}
      {cardEffects.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">카드 세트 효과</h2>
          <div className="flex flex-col gap-3">
            {cardEffects.map((ef, i) => (
              <div key={i} className="flex flex-col gap-1">
                {ef.Items.map((item, j) => (
                  <div key={j} className="flex gap-2 items-start">
                    <span className="text-xs text-amber-400 font-medium shrink-0 mt-0.5">
                      {item.Name}
                    </span>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      {stripHtml(item.Description)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 스킬 탭 ───────────────────────────────────────────── */

function SkillTab({ armory }: { armory: CharacterArmory }) {
  const skillData = armory.ArmorySkills ?? [];

  const activeSkills = skillData
    .filter(
      (s) =>
        s.Level > 1 ||
        s.Tripods?.some((t) => t.IsSelected) ||
        s.IsAwakening ||
        s.SkillType !== 0
    )
    .sort((a, b) => {
      // 각성/특수 스킬 우선
      const aSpecial = a.IsAwakening || a.SkillType !== 0 ? 1 : 0;
      const bSpecial = b.IsAwakening || b.SkillType !== 0 ? 1 : 0;
      if (bSpecial !== aSpecial) return bSpecial - aSpecial;
      // 레벨 내림차순
      return b.Level - a.Level;
    });

  if (activeSkills.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">스킬 정보 없음</p>;
  }

  const runeCount = activeSkills.filter((s) => s.Rune).length;

  return (
    <div className="pt-6 flex flex-col gap-4">
      {/* 요약 */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>스킬 {activeSkills.length}개</span>
        <span>·</span>
        <span>룬 {runeCount}개 장착</span>
      </div>

      {/* 스킬 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeSkills.map((s, i) => (
          <SkillCard key={i} skill={s} />
        ))}
      </div>
    </div>
  );
}

/* ─── 아크 패시브 탭 ────────────────────────────────────── */

function ArkPassiveTab({ armory }: { armory: CharacterArmory }) {
  const engraveData = armory.ArmoryEngraving;
  const arkPassiveEffects = Array.isArray(engraveData?.ArkPassiveEffects)
    ? engraveData.ArkPassiveEffects
    : [];
  const legacyEffects = Array.isArray(engraveData?.Effects) ? engraveData.Effects : [];

  if (arkPassiveEffects.length === 0 && legacyEffects.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-500">각인 정보 없음</p>;
  }

  return (
    <div className="pt-6">
      <div className="rounded-xl bg-slate-800 border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">장착 각인</h2>
        {arkPassiveEffects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {arkPassiveEffects.map((e, i) => (
              <div
                key={i}
                className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-medium ${engravingLevelColor(e.Level)}`}
              >
                <span>
                  {e.Name} Lv.{e.Level}
                </span>
                {e.Description && (
                  <span className="text-xs opacity-70 font-normal mt-0.5 max-w-52 leading-tight">
                    {stripHtml(e.Description)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {legacyEffects.map((e, i) => {
              const m = e.Name.match(/Lv\.(\d)/);
              const lv = m ? parseInt(m[1]) : 0;
              return (
                <div
                  key={i}
                  className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-medium ${engravingLevelColor(lv)}`}
                >
                  <span>{e.Name}</span>
                  {e.Description && (
                    <span className="text-xs opacity-70 font-normal mt-0.5 max-w-52 leading-tight">
                      {e.Description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 메인 뷰 ───────────────────────────────────────────── */

export default function ArmoryView({ armory }: { armory: CharacterArmory }) {
  const [activeTab, setActiveTab] = useState<Tab>("전투");

  return (
    <div>
      {/* ── 탭 바 (헤더 아래 고정) ── */}
      <div className="sticky top-[65px] z-10 bg-slate-900 border-b border-slate-800 -mx-4 px-4">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-white border-blue-400"
                  : "text-slate-400 border-transparent hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {activeTab === "전투"    && <BattleTab armory={armory} />}
      {activeTab === "스킬"    && <SkillTab armory={armory} />}
      {activeTab === "아크패시브" && <ArkPassiveTab armory={armory} />}
      {activeTab === "내실"    && <ComingSoon label="내실" />}
      {activeTab === "아바타"  && <ComingSoon label="아바타" />}
      {activeTab === "통계"    && <ComingSoon label="통계" />}
      {activeTab === "캐릭터"  && <ComingSoon label="캐릭터" />}
    </div>
  );
}
