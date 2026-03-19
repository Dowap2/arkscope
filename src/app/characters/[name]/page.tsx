import { notFound } from "next/navigation";
import Link from "next/link";
import { getCharacterArmory } from "@/lib/lostark/api";
import ArmoryView from "@/components/character/ArmoryView";

export const dynamic = "force-dynamic";

export default async function CharacterPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { name } = await params;
  const { from } = await searchParams;
  const characterName = decodeURIComponent(name);

  let armory;
  try {
    armory = await getCharacterArmory(characterName);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href={from ? `/raids/${from}` : "/"}
            className="text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0"
          >
            ← 뒤로
          </Link>
          <span className="text-slate-600">|</span>
          <h1 className="text-base font-bold text-white truncate">{characterName}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <ArmoryView armory={armory} />
      </main>
    </div>
  );
}
