import { getRaids } from "@/lib/supabase/raids";
import CreateRaidForm from "@/components/raid/CreateRaidForm";
import RaidList from "@/components/raid/RaidList";
import CharacterSearch from "@/components/character/CharacterSearch";

export const dynamic = "force-dynamic";

export default async function Home() {
  const raids = await getRaids();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">ArkScope</h1>
            <p className="text-xs text-slate-400 mt-0.5">로스트아크 공대 분석기</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 공대 생성 + 목록 */}
          <div className="flex flex-col gap-6">
            {/* 공대 생성 */}
            <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
              <h2 className="text-base font-semibold text-white mb-4">
                새 공대 만들기
              </h2>
              <CreateRaidForm />
            </section>

            {/* 공대 목록 */}
            <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
              <h2 className="text-base font-semibold text-white mb-4">
                공대 목록
                <span className="ml-2 text-sm font-normal text-slate-400">
                  ({raids.length})
                </span>
              </h2>
              <RaidList raids={raids} />
            </section>
          </div>

          {/* 오른쪽: 캐릭터 검색 */}
          <section className="rounded-xl bg-slate-800 border border-slate-700 p-5 h-fit lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-white mb-4">
              캐릭터 검색
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              캐릭터 이름으로 계정 내 모든 캐릭터를 조회합니다.
            </p>
            <CharacterSearch />
          </section>
        </div>
      </main>
    </div>
  );
}
