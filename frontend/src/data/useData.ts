import { useEffect, useState } from "react";
import type { ModeltellData, PublishedIndex } from "../types";

// All data lives under /data/<locale> (synced from repo-root published/<locale>).
const BASE = `${import.meta.env.BASE_URL}data`.replace(/\/$/, "");

function getJson<T>(locale: string, p: string): Promise<T> {
  return fetch(`${BASE}/${locale}/${p}`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${locale}/${p}: ${res.status}`);
    return res.json() as Promise<T>;
  });
}

export async function loadModeltellData(locale: string): Promise<ModeltellData> {
  // Fall back to English if the requested locale has no published dataset yet.
  let active = locale;
  try {
    await fetch(`${BASE}/${locale}/index.json`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
    });
  } catch {
    active = "en";
  }

  const index = await getJson<PublishedIndex>(active, "index.json");

  const [watchlistWords, watchlistConstructions, tierSummary, similarity, patterns, delta] =
    await Promise.all([
      getJson<ModeltellData["watchlistWords"]>(active, "watchlist/words.json"),
      getJson<ModeltellData["watchlistConstructions"]>(active, "watchlist/constructions.json"),
      getJson<ModeltellData["tierSummary"]>(active, "comparisons/tier-summary.json"),
      getJson<ModeltellData["similarity"]>(active, "comparisons/similarity-matrix.json"),
      getJson<ModeltellData["patterns"]>(active, "patterns/all-patterns.json"),
      getJson<NonNullable<ModeltellData["delta"]>>(active, "comparisons/delta-matrix.json").catch(() => undefined),
    ]);

  const regexAudit = await getJson<NonNullable<ModeltellData["regexAudit"]>>(
    active,
    "validation/regex-precision.json"
  ).catch(() => undefined);

  const fingerprintEntries = await Promise.all(
    index.models.map(
      async (m) => [m.id, await getJson<ModeltellData["fingerprints"][string]>(active, m.file)] as const
    )
  );

  return {
    index,
    fingerprints: Object.fromEntries(fingerprintEntries),
    watchlistWords,
    watchlistConstructions,
    tierSummary,
    similarity,
    delta,
    regexAudit,
    patterns,
  };
}

type State =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: ModeltellData };

export function useModeltellData(locale: string): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    loadModeltellData(locale)
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((err) => !cancelled && setState({ status: "error", error: String(err?.message ?? err) }));
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return state;
}
