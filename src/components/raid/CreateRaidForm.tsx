"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRaidForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [raidName, setRaidName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/raids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, raid_name: raidName || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "공대 생성 실패");
      }

      setName("");
      setRaidName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          공대 이름 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 에키드나 공대"
          required
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          레이드 이름 <span className="text-slate-500 font-normal">(선택)</span>
        </label>
        <input
          type="text"
          value={raidName}
          onChange={(e) => setRaidName(e.target.value)}
          placeholder="예) 에키드나 하드"
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-slate-900 transition-colors"
      >
        {loading ? "생성 중..." : "공대 만들기"}
      </button>
    </form>
  );
}
