import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { strings, type Lang, type Strings } from "./strings";

const STORAGE_KEY = "modeltell-lang";
const SUPPORTED: Lang[] = ["en", "de"];

function detectInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && SUPPORTED.includes(saved)) return saved;
  return navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const Ctx = createContext<LangState | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Resolve the real initial language on the client only (avoids SSR mismatch).
  useEffect(() => setLangState(detectInitial()), []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LangState>(
    () => ({
      lang,
      t: strings[lang],
      setLang: (l) => {
        setLangState(l);
        try {
          window.localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignore */
        }
      },
    }),
    [lang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useLangState(): LangState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT/useLang must be used within LangProvider");
  return ctx;
}

/** The active language's string bundle. */
export function useT(): Strings {
  return useLangState().t;
}

/** Current language + setter, for the switcher. */
export function useLang() {
  const { lang, setLang } = useLangState();
  return { lang, setLang };
}

export type { Lang };

const LABELS: Record<Lang, string> = { en: "EN", de: "DE" };

export function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`flex items-center gap-1 font-mono text-xs ${className}`}>
      {SUPPORTED.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink-line">·</span>}
          <button
            onClick={() => setLang(l)}
            className="transition-colors"
            style={{ color: lang === l ? "#e9c46a" : "#8a8a93" }}
            aria-pressed={lang === l}
          >
            {LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
