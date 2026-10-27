/**
 * Netlify Forms 제출 알림 → 텔레그램
 *
 * 파일명이 submission-created여야 Netlify가 폼 제출 때 자동으로 호출한다.
 * (이름을 바꾸면 트리거가 걸리지 않는다)
 *
 * 알림은 jv_나비(@jvcrm_bot)로 보낸다. 리드가 경로마다 다른 봇으로
 * 흩어지던 문제가 있어 02_JV 홈페이지 신청서와 같은 창구로 모은다.
 * (2026-10-14 James 결정, lead-watch.js와 같은 방식)
 *
 * 필요한 환경 변수 (Netlify 사이트 설정 → Environment variables):
 *   NABI_BOT_TOKEN   나비 봇 토큰 (02_JV/.env의 JV_LEAD_BOT_TOKEN과 같은 값)
 *   NABI_CHAT_ID     받을 채팅 ID
 * 둘 중 하나라도 없으면 조용히 넘어간다. 폼 저장과 이메일 알림은
 * Netlify가 따로 처리하므로, 텔레그램이 실패해도 문의는 유실되지 않는다.
 */

const ORDER = [
  ['회사명', '회사'],
  ['담당자명', '담당'],
  ['국가', '국가'],
  ['이메일', '이메일'],
  ['전화번호', '전화'],
  ['관심품목', '관심'],
];

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async (req) => {
  // 나비 봇 우선, 없으면 기존 공용 봇으로 떨어진다
  const token = process.env.NABI_BOT_TOKEN
    || process.env.JV_LEAD_BOT_TOKEN
    || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NABI_CHAT_ID
    || process.env.TELEGRAM_CHAT_ID;

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('bad request', { status: 400 });
  }

  const payload = body?.payload ?? {};
  if (payload.form_name && payload.form_name !== 'buyer-inquiry') {
    return new Response('ignored', { status: 200 });
  }

  if (!token || !chatId) {
    console.warn('[buyer-inquiry] 나비 봇 환경 변수가 없어 알림을 건너뜀');
    return new Response('no telegram config', { status: 200 });
  }

  const d = payload.data ?? {};
  const lines = ORDER
    .filter(([key]) => d[key])
    .map(([key, label]) => `${label}: ${esc(d[key])}`);

  const memo = d['문의내용'] ? `\n\n${esc(d['문의내용'])}` : '';
  const text =
    `🦋 <b>라에젤 바이어 문의</b>\n\n` +
    lines.join('\n') +
    memo +
    `\n\n회신 기한: 영업일 1일`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('[buyer-inquiry] 텔레그램 응답 오류', res.status, await res.text());
      return new Response('telegram failed', { status: 200 });
    }
  } catch (err) {
    console.error('[buyer-inquiry] 텔레그램 전송 실패', err);
    return new Response('telegram error', { status: 200 });
  }

  return new Response('ok', { status: 200 });
};
