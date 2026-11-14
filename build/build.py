#!/usr/bin/env python3
"""라에젤 바이어 랜딩 빌더.

build/template.html + build/i18n/<언어>.json → 저장소 루트의 index*.html

    python3 build/build.py            # 있는 언어 전부
    python3 build/build.py kr uz      # 고른 언어만

문구를 고칠 때는 i18n/*.json 을, 구조를 고칠 때는 template.html 을 고친다.
한국어(kr.json)가 기준판이다. 다른 언어에 키가 빠지거나 남으면 빌드가 멈춘다.
문구 출처: 회사소개서 최종본(2026-11-11)과 공식 상세페이지. 임의로 줄이거나 바꾸지 않는다.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SITE = "https://laezer-landing.netlify.app"

# code → (출력 파일, 경로, html lang, og locale, 스위처 라벨, 접수 완료 페이지)
LANGS = {
    "mn": ("index.html", "/", "mn", "mn_MN", "MGL", "/thanks-buyer-mn.html"),
    "kr": ("index_kr.html", "/index_kr", "ko", "ko_KR", "KOR", "/thanks-buyer.html"),
    "jp": ("index_jp.html", "/index_jp", "ja", "ja_JP", "JPN", "/thanks-buyer-jp.html"),
    "ru": ("index_ru.html", "/index_ru", "ru", "ru_RU", "RUS", "/thanks-buyer-ru.html"),
    "en": ("index_en.html", "/index_en", "en", "en_US", "ENG", "/thanks-buyer-en.html"),
    "uz": ("index_uz.html", "/index_uz", "uz", "uz_UZ", "UZB", "/thanks-buyer-uz.html"),
}
# 모공 수치는 전 언어 동일 적용 (James 2026-11-14)
TRIO = [("20.01", "r_pore"), ("7.40", "r_texture"), ("8.26", "r_calm")]


def load(code):
    return json.loads((BUILD / "i18n" / f"{code}.json").read_text(encoding="utf-8"))


def esc(s):
    """문구는 그대로 넣되 HTML 특수문자만 바꾼다. <br>, <strong> 만 허용."""
    s = html.escape(str(s), quote=True)
    return re.sub(r"&lt;(/?)(br|strong)( /)?&gt;", r"<\1\2\3>", s)


def wordmark_symbol():
    """소개서 워드마크 윤곽을 숨긴 symbol 로 한 번만 심는다 (머리·표지·꼬리가 같이 쓴다)."""
    svg = (ROOT / "images" / "buyer" / "wordmark.svg").read_text(encoding="utf-8")
    inner = re.search(r"<g\b.*</g>", svg, re.S).group(0)
    return (
        '    <svg width="0" height="0" style="position:absolute" aria-hidden="true">'
        f'<symbol id="wm" viewBox="0 0 3136 864">{inner}</symbol></svg>\n'
    )


def derived(code, d):
    out, path, lang, og, _label, thanks = LANGS[code]
    canonical = SITE + path
    hreflang = "".join(
        f'    <link rel="alternate" hreflang="{LANGS[c][2]}" href="{SITE}{LANGS[c][1]}" />\n' for c in LANGS
    ) + f'    <link rel="alternate" hreflang="x-default" href="{SITE}/" />\n'
    og_alt = "".join(
        f'    <meta property="og:locale:alternate" content="{LANGS[c][3]}" />\n' for c in LANGS if c != code
    )
    links = ""
    for c, (f, _p, hl, _og, label, _t) in LANGS.items():
        cur = ' class="active" aria-current="page"' if c == code else ""
        links += f'            <a href="{f}" lang="{hl}" data-lang-pick="{hl}"{cur}>{label}</a>\n'
    trio = "".join(
        f'              <div><span class="num">{n}%</span><span>{esc(d[k])}</span></div>\n' for n, k in TRIO
    )
    jsonld = json.dumps(
        {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": SITE + "/#organization",
                    "name": "LaEzer",
                    "alternateName": ["라에젤", "Ezer Co., Ltd"],
                    "legalName": "Ezer Co., Ltd",
                    "url": SITE + "/",
                    "logo": {"@type": "ImageObject", "url": SITE + "/images/logo-transparent.png"},
                    "email": "laezer@naver.com",
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "#1018, 66 Daehwa-ro 106beon-gil, Daedeok-gu",
                        "addressLocality": "Daejeon",
                        "addressCountry": "KR",
                    },
                    "founder": {"@type": "Person", "name": "Hyeonjeong Jeong"},
                },
                {
                    "@type": "WebPage",
                    "@id": canonical + "#webpage",
                    "url": canonical,
                    "name": d["meta_title"],
                    "description": d["meta_description"],
                    "inLanguage": lang,
                    "about": {"@id": SITE + "/#organization"},
                },
            ],
        },
        ensure_ascii=False,
        indent=2,
    )
    meta = d.get("_meta", {})
    slogan_local = d.get("slogan_local", "")
    return {
        "_lang": lang,
        "_canonical": canonical,
        "_og_locale": og,
        "_hreflang": hreflang,
        "_og_alternates": og_alt,
        "_lang_links": links,
        "_trio": trio,
        "_jsonld": jsonld,
        "_thanks": thanks,
        "_wm_symbol": wordmark_symbol(),
        "_font_links": meta.get("font_links", ""),
        "_style": meta.get("style", ""),
        "_slogan_local": f'              <p class="slogan-ko">{esc(slogan_local)}</p>\n' if slogan_local else "",
        "_extra_before_contact": meta.get("extra_before_contact", ""),
        "_footer_extra": meta.get("footer_extra", ""),
    }, out


def build(code, tpl, ref_keys):
    d = load(code)
    keys = {k for k in d if not k.startswith("_")}
    optional = {"slogan_local"}
    missing, extra = ref_keys - keys - optional, keys - ref_keys - optional
    if missing or extra:
        sys.exit(f"[{code}] 키 불일치 — 빠짐: {sorted(missing)} / 남음: {sorted(extra)}")
    dv, out = derived(code, d)
    used = set()

    def sub(m):
        k = m.group(1)
        used.add(k)
        if k in dv:
            return dv[k]
        if k not in d:
            sys.exit(f"[{code}] 템플릿이 찾는 키가 없다: {k}")
        return esc(d[k])

    page = re.sub(r"\{\{(\w+)\}\}", sub, tpl)
    unused = keys - used - optional - {"r_pore", "r_texture", "r_calm"}
    if unused:
        sys.exit(f"[{code}] 템플릿이 쓰지 않는 키: {sorted(unused)}")
    (ROOT / out).write_text(page, encoding="utf-8")
    print(f"{code}: {out} ({len(page):,}자, 문구 {len(keys)}개)")


def main():
    tpl = (BUILD / "template.html").read_text(encoding="utf-8")
    ref_keys = {k for k in load("kr") if not k.startswith("_")}
    codes = sys.argv[1:] or [c for c in LANGS if (BUILD / "i18n" / f"{c}.json").exists()]
    for c in codes:
        build(c, tpl, ref_keys)


if __name__ == "__main__":
    main()
