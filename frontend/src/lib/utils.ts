import type { ModeltellData, ModelFingerprint, RadarProfile, Tier } from "../types";
import { RADAR_DIMENSIONS, TIER_META } from "../types";

export function tierColor(tier: Tier): string {
  return TIER_META[tier].color;
}

/** Per-dimension max across all models - used to normalize radar values to 0..1. */
export function radarMaxima(fingerprints: Record<string, ModelFingerprint>): RadarProfile {
  const max = {} as RadarProfile;
  for (const { key } of RADAR_DIMENSIONS) max[key] = 0;
  for (const fp of Object.values(fingerprints)) {
    for (const { key } of RADAR_DIMENSIONS) {
      max[key] = Math.max(max[key], fp.radar[key] ?? 0);
    }
  }
  // Avoid divide-by-zero
  for (const { key } of RADAR_DIMENSIONS) if (max[key] === 0) max[key] = 1;
  return max;
}

export function normalizeRadar(radar: RadarProfile, maxima: RadarProfile): number[] {
  return RADAR_DIMENSIONS.map(({ key }) => (radar[key] ?? 0) / maxima[key]);
}

/** Average a list of radar profiles (used for tier overlays). */
export function averageRadar(profiles: RadarProfile[]): RadarProfile {
  const avg = {} as RadarProfile;
  for (const { key } of RADAR_DIMENSIONS) {
    avg[key] = profiles.length
      ? profiles.reduce((s, p) => s + (p[key] ?? 0), 0) / profiles.length
      : 0;
  }
  return avg;
}

export function modelLabel(data: ModeltellData, id: string): string {
  return data.index.models.find((m) => m.id === id)?.label ?? id;
}

export function modelTier(data: ModeltellData, id: string): Tier {
  return data.index.models.find((m) => m.id === id)?.tier ?? "frontier";
}

/** Find the most- and least-similar model pair from the cosine matrix. */
export function similarityExtremes(data: ModeltellData, ids: string[]) {
  let most: { a: string; b: string; v: number } | null = null;
  let least: { a: string; b: string; v: number } | null = null;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const v = data.similarity.matrix[a]?.[b] ?? 0;
      if (!most || v > most.v) most = { a, b, v };
      if (!least || v < least.v) least = { a, b, v };
    }
  }
  return { most, least };
}

export const fmt = (n: number, digits = 1, locale = "en-US") =>
  n.toLocaleString(locale, { maximumFractionDigits: digits });
