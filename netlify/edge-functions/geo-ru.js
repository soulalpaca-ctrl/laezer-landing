/* LaEzer landing — Netlify Edge Function: geo routing for Russian-speaking visitors
 *
 * Deploy path:  netlify/edge-functions/geo-ru.js
 * Netlify auto-registers edge functions from that directory. Edge Functions are
 * available on the FREE tier (unlike `_redirects` Country conditions, which need
 * Business/Enterprise) — this is why we use an edge function here.
 *
 * Behaviour
 *  - Only the root path "/" is intercepted. Direct URLs (/index_kr, /index_jp,
 *    /index_ru) are never touched, so they always serve what the URL says.
 *  - A visitor from RU is rewritten to /index_ru on their FIRST arrival only.
 *  - If cookie `lzr_lang` exists (set by js/lang-pref.js when the visitor uses the
 *    language switcher) the redirect is skipped entirely — the visitor's own choice
 *    always wins, so a Russian visitor can read the Mongolian or Korean page without
 *    being bounced back.
 *  - Bots/crawlers are excluded so hreflang does the indexing work and Google sees
 *    a stable "/" = Mongolian.
 *  - 302 (not 301): the decision is per-visitor and must never be cached as permanent.
 *
 * Scope: RU only for now. See report for the BY/KZ/KG expansion option — flip
 * GEO_RU_COUNTRIES to the wider set when approved.
 */

const GEO_RU_COUNTRIES = ["RU"];
// Wider Russian-speaking option, pending approval:
// const GEO_RU_COUNTRIES = ["RU", "BY", "KZ", "KG"];

const TARGET = "/index_ru";
const PREF_COOKIE = "lzr_lang";

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|whatsapp|telegrambot|discordbot|applebot|yandex|duckduckbot|baiduspider|ia_archiver|lighthouse|headlesschrome|gptbot|claudebot|ccbot|perplexitybot/i;

export default async (request, context) => {
  const url = new URL(request.url);

  // 1. Root path only.
  if (url.pathname !== "/" && url.pathname !== "/index.html") return;

  // 2. Respect an existing explicit language choice.
  const cookie = request.headers.get("cookie") || "";
  if (cookie.split(/;\s*/).some((c) => c.startsWith(PREF_COOKIE + "="))) return;

  // 3. Leave crawlers alone — hreflang handles discovery of the RU page.
  const ua = request.headers.get("user-agent") || "";
  if (BOT_RE.test(ua)) return;

  // 4. Geo check.
  const country = context?.geo?.country?.code || "";
  if (!GEO_RU_COUNTRIES.includes(country)) return;

  // 5. Send them to the Russian page.
  url.pathname = TARGET;
  return Response.redirect(url.toString(), 302);
};

export const config = { path: "/" };
