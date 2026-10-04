# 배포 절차서 — laezer-landing

최종 갱신: 2026-10-04

---

## 0. 배포 구조 (먼저 읽을 것)

**이 레포 하나의 소스를 Netlify 사이트 2개가 서빙합니다.**

| 사이트 | 배포 방식 | 반영 시점 |
|---|---|---|
| `laezer-landing.netlify.app` | **GitHub 연동 자동배포** | `git push` 즉시 (수분 내) |
| `laezer.netlify.app` | **netlify CLI 직접배포** | `netlify deploy --prod` 실행 시에만 |

→ **`git push` = 즉시 라이브 반영**입니다. 로컬 커밋과 push를 분리해서 생각하세요.
→ 한쪽만 배포하면 **두 사이트의 내용이 어긋납니다.** 항상 둘 다 실행하세요.

---

## 1. 배포 전 — 백업 (생략 금지)

```bash
cd 03_LaEzer/projects/laezer-landing

# 되돌아갈 지점 기록
git rev-parse HEAD | tee ~/laezer-landing-ROLLBACK-$(date +%F).txt

# 현재 라이브 배포 ID 기록 (롤백 시 이 ID로 Publish)
netlify api listSiteDeploys --data '{"site_id":"<laezer-landing siteId>"}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin)[0];print(d['id'],d['created_at'],d['state'])"
```

---

## 2. 로컬 확인

```bash
netlify dev            # http://localhost:8888
```

체크:
- [ ] `/`, `/index_kr`, `/index_jp`, `/index_ru` 4개 모두 렌더
- [ ] 언어 선택기 4개 버튼, 왕복 이동 정상
- [ ] 러시아어판 키릴 깨짐 없음, 버튼·배지 안 터짐 (모바일 375px 포함)
- [ ] 언어 클릭 후 DevTools → Application → Cookies 에 `lzr_lang` 생성됨
- [ ] Edge Function 로드됨 (`netlify dev` 로그에 `geo-ru` 표시)

---

## 3-A. push 기반 배포 (laezer-landing.netlify.app)

```bash
git log --oneline -3          # 올라갈 커밋 확인
git push origin main          # ← 이 순간 라이브 반영 시작
```

Netlify 대시보드 → Deploys 에서 `Published` 확인 (보통 1~3분).

## 3-B. CLI 기반 배포 (laezer.netlify.app)

```bash
# 먼저 draft로 올려 미리보기 URL에서 확인 (권장)
netlify deploy --site <laezer siteId> --dir .

# 확인 후 프로덕션
netlify deploy --prod --site <laezer siteId> --dir .
```

> `netlify link`가 안 돼 있으면 `netlify link --id <siteId>` 먼저.
> siteId는 Netlify 대시보드 → Site configuration → Site information 에서 확인.

---

## 4. 배포 후 확인

```bash
for u in / /index_kr /index_jp /index_ru; do
  echo -n "$u -> "; curl -s -o /dev/null -w "%{http_code}\n" "https://laezer-landing.netlify.app$u"
done
```

- [ ] 4개 URL 200
- [ ] 러시아 VPN(또는 RU IP)으로 `/` 접속 → `/index_ru` 자동 이동
- [ ] 같은 브라우저에서 MGL 클릭 → `/` 재접속 시 **몽골어 유지** (사용자 선택 존중 확인)
- [ ] `laezer.netlify.app` 도 동일 내용인지 대조
- [ ] Search Console에 `/index_ru` 색인 요청

---

## 5. 롤백

### 가장 빠른 방법 (수초) — 두 사이트 공통
Netlify 대시보드 → 해당 사이트 → **Deploys** → 직전 정상 배포 → **"Publish deploy"**
빌드 없이 즉시 전환됩니다. 레포는 건드리지 않습니다.

### git 되돌리기 (laezer-landing 자동배포 사이트)
```bash
git revert <문제 커밋>
git push origin main
```

### 부분 롤백
| 되돌릴 대상 | 방법 | 영향 |
|---|---|---|
| **지역 분기만 끄기** | `netlify/edge-functions/geo-ru.js` 삭제 후 재배포 | 러시아어 페이지는 남고 자동 이동만 중단 |
| **러시아어판 전체 철회** | `index_ru.html` 삭제 + 3개 페이지의 RUS 버튼 1줄씩 제거 + `geo-ru.js` 삭제 | MN/KR/JP 본문 무영향 |
| **언어 선택기만 원복** | 각 파일 `<li class="lang-switcher-container">` 블록만 되돌림 | 본문 무영향 |

> 러시아어판은 기존 3개 언어와 **완전히 독립**입니다. 최악의 경우에도 운영 중인 MN/KR/JP 본문에는 변경점이 없습니다 (언어 선택기 블록 + `<head>` hreflang 추가뿐).

---

## 6. 알려진 지뢰

- **공유 CSS 다국어 사이트**: `css/style.css` 하나를 4개 언어가 공유합니다. 2026-06-13에 몽골어판만 재디자인하며 CSS를 갈아치워 **KR/JP가 3주간 깨진 채 서빙**된 사고가 있었습니다. 한 언어만 재디자인 금지 — CSS 변경 시 4개 언어 전부 확인.
- **언어 추가 시**: 언어 선택기가 하드코딩 링크라 **모든 페이지를 고쳐야** 합니다. 한 곳이라도 빠지면 그 페이지에서 신규 언어로 갈 수 없습니다.
- **`js/lang-pref.js`는 모든 언어 페이지에 들어가야 합니다.** 빠진 페이지에서 언어를 고르면 쿠키가 안 생겨 러시아 사용자가 계속 러시아어로 튕깁니다.
- **BSD grep `-i`가 키릴 대문자를 못 잡습니다.** 몽골어·러시아어 검증은 Python `(?i)` 정규식으로.
