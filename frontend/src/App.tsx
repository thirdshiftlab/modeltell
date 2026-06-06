import { useEffect, useState } from "react";
import { useModeltellData } from "./data/useData";
import { FilterProvider } from "./state/filters";
import { ScrollProgress } from "./components/ScrollProgress";
import { FilterBar } from "./components/FilterBar";
import { NewsletterPopup } from "./components/NewsletterPopup";
import { Story } from "./Story";
import { Methodology } from "./pages/Methodology";
import { LangProvider, LangSwitcher, useT, useLang } from "./i18n";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function AppInner() {
  const { lang } = useLang();
  const state = useModeltellData(lang); // dataset language follows the UI language
  const hash = useHashRoute();
  const t = useT();
  const route = hash.replace(/^#/, "");

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="eyebrow animate-pulse">{t.common.loading}</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-prose flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display-lg">{t.common.noDataTitle}</h1>
        <p className="lede">{t.common.noDataLede}</p>
        <pre className="rounded-xl border border-ink-line bg-ink-soft p-4 text-left font-mono text-xs text-paper/80">
{`npx tsx scripts/mock-run.ts
npx tsx src/analysis/lexical.ts data/<run>
npx tsx src/analysis/syntactic.ts data/<run>
npx tsx src/publish/publish.ts data/<run>`}
        </pre>
        <p className="font-mono text-xs text-muted">{state.error}</p>
      </div>
    );
  }

  if (route.startsWith("/methodology")) {
    return <Methodology data={state.data} />;
  }

  return (
    <FilterProvider data={state.data}>
      <ScrollProgress />
      <a
        href="#/methodology"
        className="fixed left-5 top-4 z-40 font-mono text-xs text-muted transition-colors hover:text-paper"
      >
        {t.nav.methodology} ↗
      </a>
      <LangSwitcher className="fixed right-5 top-4 z-40" />
      <Story data={state.data} />
      <FilterBar data={state.data} />
      <NewsletterPopup />
    </FilterProvider>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
