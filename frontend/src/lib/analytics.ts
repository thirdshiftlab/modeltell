// Umami analytics (self-hosted, cookieless). Loads only when configured at
// build time via VITE_UMAMI_WEBSITE_ID. Serve the script from your own subdomain
// (e.g. analytics.modeltell.com) for first-party, ad-blocker-resilient delivery.
//
//   VITE_UMAMI_WEBSITE_ID=<uuid from Umami → Settings → Websites>
//   VITE_UMAMI_SRC=https://analytics.modeltell.com/script.js   (defaults to this)

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const SRC =
  (import.meta.env.VITE_UMAMI_SRC as string | undefined) || "https://analytics.modeltell.com/script.js";

declare global {
  interface Window {
    umami?: { track: (payload?: unknown) => void };
  }
}

export function initAnalytics() {
  if (!WEBSITE_ID || typeof document === "undefined") return;
  if (document.querySelector("script[data-website-id]")) return;

  const s = document.createElement("script");
  s.async = true;
  s.src = SRC;
  s.setAttribute("data-website-id", WEBSITE_ID);
  document.head.appendChild(s);

  // The methodology page lives at #/methodology — track hash routes as their own
  // pageviews so they don't all collapse into "/".
  let last = location.hash;
  window.addEventListener("hashchange", () => {
    if (location.hash === last) return;
    last = location.hash;
    window.umami?.track?.((props: Record<string, unknown>) => ({
      ...props,
      url: location.pathname + location.hash,
    }));
  });
}
