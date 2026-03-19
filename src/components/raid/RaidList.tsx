"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Raid } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RaidList({ raids }: { raids: Raid[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("공대를 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/raids/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (raids.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-8">
        아직 생성된 공대가 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {raids.map((raid) => (
        <li
          key={raid.id}
          className="flex items-center justify-between rounded-lg bg-slate-700/50 border border-slate-700 px-4 py-3 hover:border-slate-600 transition-colors"
        >
          <Link href={`/raids/${raid.id}`} className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{raid.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {raid.raid_name ? (
                <span className="text-amber-400 mr-2">{raid.raid_name}</span>
              ) : null}
              {formatDate(raid.created_at)}
            </p>
          </Link>
          <button
            onClick={() => handleDelete(raid.id)}
            disabled={deletingId === raid.id}
            className="ml-4 flex-shrink-0 text-slate-500 hover:text-red-400 disabled:opacity-40 transition-colors text-sm"
            title="삭제"
          >
            {deletingId === raid.id ? "삭제 중..." : "✕"}
          </button>
        </li>
      ))}
    </ul>
  );
}
