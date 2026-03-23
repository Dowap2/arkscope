"use client";

import { useState } from "react";
import Link from "next/link";
import { LostarkCharacter } from "@/types";
import { getLevelTier } from "@/lib/level";

function parseItemLevel(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

export default function CharacterSearch() {
  const [query, setQuery] = useState("");
  const [characters, setCharacters] = useState<LostarkCharacter[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setLoading(true);
    setCharacters(null);

    try {
      const res = await fetch(
        `/api/characters/search?name=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "검색 실패");

      const sorted = [...data].sort(
        (a: LostarkCharacter, b: LostarkCharacter) =>
          parseItemLevel(b.ItemAvgLevel) - parseItemLevel(a.ItemAvgLevel)
      );
      setCharacters(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="캐릭터 이름 입력"
          className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-slate-900 transition-colors"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {characters !== null && (
        <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
          {characters.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              캐릭터를 찾을 수 없습니다.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-1">
                총 {characters.length}개 캐릭터
              </p>
              {characters.map((c) => {
                const level = parseItemLevel(c.ItemAvgLevel);
                return (
                  <Link
                    key={c.CharacterName}
                    href={`/characters/${encodeURIComponent(c.CharacterName)}`}
                    className="flex items-center justify-between rounded-lg bg-slate-700/50 border border-slate-700 px-3 py-2 hover:bg-slate-700 hover:border-slate-500 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-white text-sm">
                        {c.CharacterName}
                      </span>
                      <span className="text-slate-400 text-xs ml-2">
                        @{c.ServerName}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.CharacterClassName}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold flex-shrink-0 ml-3 ${getLevelTier(level).color}`}
                    >
                      {c.ItemAvgLevel}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
