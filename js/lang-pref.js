/* LaEzer landing — language preference memory
 * Purpose: the RU geo-redirect (netlify/edge-functions/geo-ru.js) must only fire
 * on a visitor's FIRST arrival. Once a visitor picks a language from the switcher,
 * that choice wins forever.
 *
 * Mechanism: clicking any .lang-btn[data-lang-pick] sets cookie `lzr_lang`
 * (1 year, path=/, SameSite=Lax). The edge function skips the redirect whenever
 * that cookie is present. localStorage is kept as a non-authoritative mirror.
 *
 * Include on ALL language pages: <script src="js/lang-pref.js"></script>
 */
(function () {
  "use strict";

  var COOKIE = "lzr_lang";
  var MAX_AGE = 60 * 60 * 24 * 365; // 1 year
  var VALID = { mn: 1, ko: 1, ja: 1, ru: 1 , en: 1};

  function setPref(lang) {
    if (!VALID[lang]) return;
    try {
      document.cookie =
        COOKIE + "=" + lang + ";path=/;max-age=" + MAX_AGE + ";SameSite=Lax";
    } catch (e) {}
    try {
      window.localStorage.setItem(COOKIE, lang);
    } catch (e) {}
  }

  function hasCookie() {
    return ("; " + document.cookie).indexOf("; " + COOKIE + "=") > -1;
  }

  // 1) Explicit pick from the switcher always wins.
  document.addEventListener(
    "click",
    function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest("[data-lang-pick]") : null;
      if (!el) return;
      setPref(el.getAttribute("data-lang-pick"));
    },
    true
  );

  // 2) Landing directly on a language URL (bookmark, shared link, search result)
  //    also counts as an intentional choice — but only if nothing is stored yet,
  //    so it can never overwrite a real pick.
  if (!hasCookie()) {
    var lang = (document.documentElement.getAttribute("lang") || "").slice(0, 2).toLowerCase();
    if (VALID[lang]) setPref(lang);
  }
})();
