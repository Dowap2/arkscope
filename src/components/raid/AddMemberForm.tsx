"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({ raidId }: { raidId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/raids/${raidId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterName: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "원정대 추가 실패");

      setName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="캐릭터 이름 입력"
          disabled={loading}
          className="flex-1 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-slate-900 transition-colors whitespace-nowrap"
        >
          {loading ? "추가 중..." : "원정대 추가"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-slate-500">
        계정 내 모든 캐릭터가 자동으로 등록됩니다.
      </p>
    </form>
  );
}
