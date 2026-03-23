export type LevelTier = {
  label: string;
  color: string;
  bg: string;
  min: number;
  max: number;
};

export const LEVEL_TIERS: LevelTier[] = [
  { label: "1750+",      color: "text-purple-300", bg: "bg-purple-500/20",  min: 1750, max: Infinity },
  { label: "1730~1749",  color: "text-violet-400", bg: "bg-violet-500/20",  min: 1730, max: 1749 },
  { label: "1720~1729",  color: "text-red-400",    bg: "bg-red-500/20",     min: 1720, max: 1729 },
  { label: "1700~1719",  color: "text-orange-400", bg: "bg-orange-500/20",  min: 1700, max: 1719 },
  { label: "1680~1699",  color: "text-amber-400",  bg: "bg-amber-500/20",   min: 1680, max: 1699 },
  { label: "1620~1679",  color: "text-yellow-400", bg: "bg-yellow-500/20",  min: 1620, max: 1679 },
  { label: "1540~1619",  color: "text-green-400",  bg: "bg-green-500/20",   min: 1540, max: 1619 },
  { label: "1490~1539",  color: "text-teal-400",   bg: "bg-teal-500/20",    min: 1490, max: 1539 },
  { label: "~1489",      color: "text-slate-400",  bg: "bg-slate-500/20",   min: 0,    max: 1489 },
];

export function getLevelTier(level: number): LevelTier {
  const floored = Math.floor(level);
  return (
    LEVEL_TIERS.find((t) => floored >= t.min && floored <= t.max) ??
    LEVEL_TIERS[LEVEL_TIERS.length - 1]
  );
}
