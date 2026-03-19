import { notFound } from "next/navigation";
import Link from "next/link";
import { getRaidDetail } from "@/lib/supabase/members";
import AddMemberForm from "@/components/raid/AddMemberForm";
import MemberList from "@/components/raid/MemberList";

export const dynamic = "force-dynamic";

export default async function RaidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raid = await getRaidDetail(id);

  if (!raid) notFound();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← 홈
          </Link>
          <span className="text-slate-600">|</span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white leading-none truncate">
              {raid.name}
            </h1>
            {raid.raid_name && (
              <p className="text-xs text-amber-400 mt-0.5">{raid.raid_name}</p>
            )}
          </div>
          <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
            {raid.members.length}개 원정대
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* 원정대 추가 */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-base font-semibold text-white mb-4">
            원정대 추가
          </h2>
          <AddMemberForm raidId={id} />
        </section>

        {/* 원정대 목록 */}
        <section>
          <h2 className="text-base font-semibold text-white mb-4">
            원정대 목록
          </h2>
          <MemberList members={raid.members} raidId={id} />
        </section>
      </main>
    </div>
  );
}
