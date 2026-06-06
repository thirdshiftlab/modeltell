import type { ModeltellData } from "./types";
import { Hook } from "./sections/Hook";
import { WordCloud } from "./sections/WordCloud";
import { Fingerprints } from "./sections/Fingerprints";
import { HeadToHead } from "./sections/HeadToHead";
import { VersionDrift } from "./sections/VersionDrift";
import { PatternDeepDive } from "./sections/PatternDeepDive";
import { TierAnalysis } from "./sections/TierAnalysis";
import { SimilarityHeatmap } from "./sections/SimilarityHeatmap";
import { Watchlist } from "./sections/Watchlist";

export function Story({ data }: { data: ModeltellData }) {
  return (
    <main>
      <Hook data={data} />
      <WordCloud data={data} />
      <Fingerprints data={data} />
      <HeadToHead data={data} />
      <VersionDrift data={data} />
      <PatternDeepDive data={data} />
      <TierAnalysis data={data} />
      <SimilarityHeatmap data={data} />
      <Watchlist data={data} />
    </main>
  );
}
