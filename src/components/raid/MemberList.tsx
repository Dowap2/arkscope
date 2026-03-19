"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MemberWithCharacters } from "@/lib/supabase/members";
import { getLevelTier, LEVEL_TIERS } from "@/lib/level";
import { Character } from "@/types";

type CharacterWithMember = Character & { accountName: string };

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? `${color ?? "text-amber-400"} border-current bg-current/10`
          : "text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

export default function MemberList({
  members,
  raidId,
}: {
  members: MemberWithCharacters[];
  raidId: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedLevelLabels, setSelectedLevelLabels] = useState<Set<string>>(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  const allCharacters: CharacterWithMember[] = useMemo(
    () =>
      members
        .flatMap((m) =>
          m.characters.map((c) => ({ ...c, accountName: m.account_name }))
        )
        .sort((a, b) => Number(b.item_level) - Number(a.item_level)),
    [members]
  );

  // 고유 직업 목록
  const uniqueClasses = useMemo(
    () => [...new Set(allCharacters.map((c) => c.class))].sort(),
    [allCharacters]
  );

  // 고유 원정대 목록
  const uniqueAccounts = useMemo(
    () => members.map((m) => m.account_name),
    [members]
  );

  // 필터 적용
  const filtered = useMemo(() => {
    return allCharacters.filter((c) => {
      if (selectedClasses.size > 0 && !selectedClasses.has(c.class)) return false;
      if (selectedLevelLabels.size > 0) {
        const tier = getLevelTier(Number(c.item_level));
        if (!selectedLevelLabels.has(tier.label)) return false;
      }
      if (selectedAccounts.size > 0 && !selectedAccounts.has(c.accountName)) return false;
      return true;
    });
  }, [allCharacters, selectedClasses, selectedLevelLabels, selectedAccounts]);

  function toggleClass(cls: string) {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      next.has(cls) ? next.delete(cls) : next.add(cls);
      return next;
    });
  }

  function toggleAccount(acc: string) {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      next.has(acc) ? next.delete(acc) : next.add(acc);
      return next;
    });
  }

  function toggleLevelLabel(label: string) {
    setSelectedLevelLabels((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function clearFilters() {
    setSelectedClasses(new Set());
    setSelectedLevelLabels(new Set());
    setSelectedAccounts(new Set());
  }

  const hasFilter =
    selectedClasses.size > 0 || selectedLevelLabels.size > 0 || selectedAccounts.size > 0;

  async function handleDeleteMember(id: string, name: string) {
    if (!confirm(`"${name}" 원정대를 삭제하시겠습니까?`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/raids/${raidId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: id }),
      });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (members.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-10">
        아직 추가된 원정대가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 전체 캐릭터 합산 목록 */}
      <section className="flex flex-col gap-3">
        {/* 필터 UI */}
        <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 flex flex-col gap-3">
          {/* 레벨 구간 */}
          <div>
            <p className="text-xs text-slate-500 mb-2">레벨 구간</p>
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_TIERS.map((t) => (
                <FilterChip
                  key={t.label}
                  label={t.label}
                  active={selectedLevelLabels.has(t.label)}
                  color={t.color}
                  onClick={() => toggleLevelLabel(t.label)}
                />
              ))}
            </div>
          </div>

          {/* 직업 */}
          {uniqueClasses.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">직업</p>
              <div className="flex flex-wrap gap-1.5">
                {uniqueClasses.map((cls) => (
                  <FilterChip
                    key={cls}
                    label={cls}
                    active={selectedClasses.has(cls)}
                    onClick={() => toggleClass(cls)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 원정대 */}
          {uniqueAccounts.length > 1 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">원정대</p>
              <div className="flex flex-wrap gap-1.5">
                {uniqueAccounts.map((acc) => (
                  <FilterChip
                    key={acc}
                    label={acc}
                    active={selectedAccounts.has(acc)}
                    onClick={() => toggleAccount(acc)}
                  />
                ))}
              </div>
            </div>
          )}

          {hasFilter && (
            <button
              onClick={clearFilters}
              className="self-start text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 캐릭터 목록 */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">
            캐릭터{" "}
            <span className="text-white font-semibold">{filtered.length}</span>
            {hasFilter && (
              <span className="text-slate-500"> / {allCharacters.length}</span>
            )}
            명
          </h3>
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs text-slate-500 px-4 py-2 bg-slate-800 border-b border-slate-700 gap-3">
              <span>캐릭터</span>
              <span>직업</span>
              <span>원정대</span>
              <span className="text-right">아이템레벨</span>
            </div>
            <div className="divide-y divide-slate-700/50 bg-slate-800/50">
              {filtered.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">
                  조건에 맞는 캐릭터가 없습니다.
                </p>
              ) : (
                filtered.map((c) => {
                  const tier = getLevelTier(Number(c.item_level));
                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2.5 gap-3 hover:bg-slate-700/30 transition-colors"
                    >
                      <Link
                        href={`/characters/${encodeURIComponent(c.character_name)}?from=${raidId}`}
                        className="text-sm text-white font-medium truncate hover:text-amber-400 transition-colors"
                      >
                        {c.character_name}
                      </Link>
                      <span className="text-xs text-slate-400 text-right">
                        {c.class}
                      </span>
                      <span className="text-xs text-slate-500 text-right">
                        {c.accountName}
                      </span>
                      <span className={`text-sm font-semibold text-right ${tier.color}`}>
                        {Number(c.item_level).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 원정대 관리 */}
      <section>
        <h3 className="text-sm font-medium text-slate-400 mb-3">
          원정대 관리{" "}
          <span className="text-white font-semibold">{members.length}</span>개
        </h3>
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const topChar = m.characters[0];
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-slate-800 border border-slate-700 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-white">
                    {m.account_name}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {m.characters.length}캐릭터
                  </span>
                  {topChar && (
                    <span
                      className={`text-xs ml-2 ${getLevelTier(Number(topChar.item_level)).color}`}
                    >
                      최고 {Number(topChar.item_level).toLocaleString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteMember(m.id, m.account_name)}
                  disabled={deletingId === m.id}
                  className="ml-4 text-slate-500 hover:text-red-400 disabled:opacity-40 transition-colors text-sm flex-shrink-0"
                >
                  {deletingId === m.id ? "..." : "✕"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
