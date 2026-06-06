import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT, useLang } from "../i18n";

// Brevo's PUBLIC form-submission URL (e.g. https://sibforms.com/serve/MUIF...).
// Safe to expose — it is NOT an API key. Get it from Brevo → Contacts → Forms →
// "Share" → the <form action="…"> URL. Set it as VITE_BREVO_FORM_URL at build time.
const BREVO_FORM_URL = (import.meta.env.VITE_BREVO_FORM_URL as string | undefined) || "";
const LOGO_SRC = `${import.meta.env.BASE_URL}thirdshiftlab-logo.svg`;
const STORAGE_KEY = "modeltell-newsletter"; // "dismissed" | "subscribed"
const SCROLL_TRIGGER = 0.35; // show after scrolling past 35% of the page

export function NewsletterPopup() {
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll trigger — once per visitor, unless already dismissed/subscribed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (seen) return;

    const onScroll = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable > SCROLL_TRIGGER) {
        setOpen(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const persist = (v: "dismissed" | "subscribed") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const close = () => {
    setOpen(false);
    persist("dismissed");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!BREVO_FORM_URL) {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.warn("[Modeltell] VITE_BREVO_FORM_URL is not set — newsletter is not connected to Brevo.");
    }
    // If configured, let the native POST go to the hidden iframe (no CORS/keys).
    persist("subscribed");
    setDone(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <button aria-label="close" onClick={close} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-ink-line bg-ink-card p-7 shadow-2xl"
          >
            {/* brand accent — the three Third Shift Lab colors */}
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "linear-gradient(90deg,#33cc66,#ffb000,#33ccee)" }}
            />

            <button
              onClick={close}
              aria-label="close"
              className="absolute right-4 top-4 font-mono text-lg leading-none text-muted transition-colors hover:text-paper"
            >
              ×
            </button>

            {/* brand / logo */}
            <div className="mb-5 flex items-center gap-3">
              {logoOk ? (
                <img
                  src={LOGO_SRC}
                  alt="Third Shift Lab"
                  className="h-11 w-11 rounded-xl ring-1 ring-ink-line"
                  onError={() => setLogoOk(false)}
                />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink font-mono text-lg font-bold text-paper ring-1 ring-ink-line">
                  ///
                </span>
              )}
              <span className="font-display text-base font-semibold text-paper">Third Shift Lab</span>
            </div>

            {done ? (
              <div className="py-2">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-accent-gold/15 font-mono text-base text-accent-gold">
                  ✓
                </div>
                <p className="text-paper/85">{t.newsletter.success}</p>
              </div>
            ) : (
              <>
                <div className="eyebrow mb-2">{t.newsletter.eyebrow}</div>
                <h3 className="mb-2 font-display text-2xl font-semibold text-paper">{t.newsletter.title}</h3>
                <p className="mb-5 text-sm text-paper/75">{t.newsletter.body}</p>

                {/* Hidden iframe target so the cross-origin POST never navigates the page. */}
                <iframe name="brevo_iframe" title="brevo" className="hidden" />
                <form
                  ref={formRef}
                  action={BREVO_FORM_URL || "#"}
                  method="POST"
                  target="brevo_iframe"
                  onSubmit={onSubmit}
                  className="flex flex-col gap-2"
                >
                  {/* Brevo anti-bot honeypot — must stay empty/hidden. */}
                  <input type="text" name="email_address_check" defaultValue="" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <input type="hidden" name="locale" value={lang} />
                  <input
                    type="email"
                    name="EMAIL"
                    required
                    placeholder={t.newsletter.placeholder}
                    className="rounded-lg border border-ink-line bg-ink px-4 py-2.5 font-mono text-sm text-paper outline-none transition-colors focus:border-accent-gold"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-accent-gold px-4 py-2.5 font-mono text-sm font-semibold text-ink transition-opacity hover:opacity-90"
                  >
                    {t.newsletter.cta}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted">
                  <span>{t.newsletter.privacy}</span>
                  <button onClick={close} className="transition-colors hover:text-paper">
                    {t.newsletter.dismiss}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
