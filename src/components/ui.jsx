import { C, serif, sans } from "../theme.js";

// ---- 공통 버튼 / 링크 (CTA) ----
export function CTA({ children, primary, onClick, href, small, title }) {
  const style = {
    // small: 분할 다운로드처럼 버튼이 여러 개 붙는 자리에서 쓰는 축소 사이즈
    padding: small ? "9px 16px" : "12px 26px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: sans,
    fontSize: small ? 13 : 15,
    fontWeight: 600,
    letterSpacing: 1,
    background: primary ? C.gold : "rgba(20,16,11,0.6)",
    color: primary ? C.ink : C.gold,
    border: `1px solid ${C.gold}`,
    transition: "transform .15s",
    display: "inline-block",
    textDecoration: "none",
  };
  const press = {
    onMouseDown: (e) => (e.currentTarget.style.transform = "scale(0.97)"),
    onMouseUp: (e) => (e.currentTarget.style.transform = "scale(1)"),
    onMouseLeave: (e) => (e.currentTarget.style.transform = "scale(1)"),
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} style={style} {...press}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} title={title} style={style} {...press}>
      {children}
    </button>
  );
}

// ---- 섹션 래퍼 ----
export function Section({ eyebrow, title, children }) {
  return (
    <section style={{ maxWidth: 980, margin: "0 auto", padding: "64px 22px" }}>
      {eyebrow && (
        <p
          style={{
            color: C.goldDim,
            letterSpacing: 4,
            fontSize: 12,
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        style={{
          fontFamily: serif,
          color: C.gold,
          fontSize: "clamp(22px,3.5vw,32px)",
          margin: "0 0 26px",
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---- 통계 카드 ----
export function Stat({ label, v, color }) {
  return (
    <div
      style={{
        background: C.ink2,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontFamily: serif,
          fontSize: 24,
          fontWeight: 700,
          color: color || C.text,
        }}
      >
        {v}
      </div>
      <div style={{ color: C.textDim, fontSize: 12, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ---- 쪽 넘김 (방명록·제보) ----
// 휴대폰 폭에서도 한 줄에 들어가게 처음·끝과 현재 쪽 앞뒤 하나만 번호로 보이고 나머지는 … 로 줄인다.
// 예) ‹ 1 … 5 6 7 … 27 ›
export function Pager({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const nums = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) nums.push(p);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const btn = (on) => ({
    minWidth: 34,
    height: 34,
    padding: "0 6px",
    borderRadius: 8,
    border: `1px solid ${on ? C.gold : C.line}`,
    background: on ? C.gold : "transparent",
    color: on ? C.ink : C.sepia,
    fontFamily: sans,
    fontSize: 14,
    fontWeight: on ? 700 : 400,
    cursor: on ? "default" : "pointer",
  });
  const arrow = (to, label, text) => (
    <button
      onClick={() => onChange(to)}
      disabled={to < 1 || to > pageCount}
      aria-label={label}
      style={{ ...btn(false), opacity: to < 1 || to > pageCount ? 0.35 : 1 }}
    >
      {text}
    </button>
  );
  return (
    <nav
      aria-label="쪽 넘김"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        marginTop: 22,
      }}
    >
      {arrow(page - 1, "이전 쪽", "‹")}
      {nums.map((p, i) =>
        p === "…" ? (
          <span key={`gap${i}`} style={{ color: C.textDim, minWidth: 18, textAlign: "center" }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => p !== page && onChange(p)}
            aria-current={p === page ? "page" : undefined}
            style={btn(p === page)}
          >
            {p}
          </button>
        )
      )}
      {arrow(page + 1, "다음 쪽", "›")}
    </nav>
  );
}

// 쪽을 넘기면 목록 첫 줄로 올린다. 위에 붙은 네비(약 70px)에 가리지 않게 조금 띄운다.
export function scrollToList(el) {
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90);
}

// ---- 공통 입력창 스타일 ----
export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  background: C.ink,
  color: C.text,
  border: `1px solid ${C.line}`,
  fontSize: 14,
  fontFamily: sans,
  outline: "none",
};

// ---- 전역 스타일 (폰트 import + 셀렉션 등) ----
export function GlobalStyle() {
  return (
    <style>{`
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&display=swap');
      * { -webkit-tap-highlight-color: transparent; }
      ::selection { background: ${C.gold}; color: ${C.ink}; }
      body { margin: 0; }
      code { font-family: ui-monospace, monospace; background: ${C.ink}; padding: 1px 5px; border-radius: 4px; color: ${C.sepia}; font-size: 0.88em; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      /* 판본 선택(variants) 안내는 버튼 묶음 오른쪽 끝에 맞춘다 */
      .variant-pick { text-align: right; }
      .variant-pick .variant-buttons { justify-content: flex-end; }
      /* 네비 버튼 기본 크기(인라인 대신 CSS로 관리 → 모바일에서 축소 가능) */
      .nav-links button { padding: 8px 16px; font-size: 14px; letter-spacing: 0.5px; }
      /* 모바일: 사이트명 두 줄(방랑자의 / 그늘쉼터) + 네비 버튼 4개가 들어가도록 여백 축소 */
      @media (max-width: 640px) {
        .site-name-part { display: block; }
        nav { padding-left: 14px !important; padding-right: 14px !important; }
        /* 버튼 5개를 한 줄로. 줄바꿈을 막고 폭을 줄인다(인라인 flex 를 덮어야 해서 !important) */
        .nav-links { flex-wrap: nowrap !important; gap: 4px !important; }
        .nav-links button { padding: 6px 8px; font-size: 13px; letter-spacing: 0; }
        /* 카드가 세로로 쌓이면 오른쪽 정렬된 안내가 배경 그림 한가운데(인물 얼굴)를 가린다 */
        .variant-pick { text-align: left; }
        .variant-pick .variant-buttons { justify-content: flex-start; }
        /* 위아래 두 카드에 그림 한 장을 나눠 깔기.
           카드(175) 2개 + 사이 간격(18) = 368 ≈ 카드 높이의 210% 로 키우고,
           위 카드는 그림 위쪽, 아래 카드는 아래쪽을 보여준다. */
        .bg-mo { background-position: var(--bg-mo) !important; }
        .bg-pair { background-size: auto 210% !important; }
        .bg-pair-top { background-position: center 0% !important; }
        .bg-pair-bottom { background-position: center 100% !important; }
      }
      /* 다운로드 바둑판 보기(암자 토글). PC 3열 → 태블릿 2열 → 휴대폰 작은 2열.
         열을 minmax(0,1fr) 로 둬서 긴 제목이 카드 폭을 밀어내지 않게 한다. */
      .dl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .dl-grid .dl-body { padding: 14px 16px 16px; }
      .dl-grid .dl-title { font-size: 17px; }
      /* 판본·다운로드 버튼은 카드 폭을 나눠 채우고, 모자라면 다음 줄로 */
      .dl-fill { display: flex; flex-wrap: wrap; gap: 6px; }
      .dl-fill > * { flex: 1 1 auto; text-align: center; }
      /* 분할 칩은 번호 한 글자라 좌우 여백 없이 같은 폭으로 → 좁은 카드에서도 한 줄
         (인라인 padding 을 덮어야 해서 !important) */
      .dl-parts > * { flex-basis: 0; padding-left: 0 !important; padding-right: 0 !important; }
      @media (max-width: 900px) {
        .dl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        .dl-grid { gap: 10px; }
        .dl-grid .dl-body { padding: 10px 11px 12px; }
        .dl-grid .dl-title { font-size: 14.5px; }
        /* "V1 스팀 번역판" 같은 판본 이름이 두 줄로 안 갈라지게 버튼 좌우 여백을 줄인다 */
        .dl-fill:not(.dl-parts) > * { padding-left: 8px !important; padding-right: 8px !important; }
      }
      /* 좁은 폰(≤420px). 414px 아이폰도 메뉴가 화면 끝을 1px 넘어서 400 → 420 으로 넓혔다.
         사이트명 글자를 조금 줄여 자리를 만든다(인라인 fontSize 를 덮어야 해서 !important) */
      @media (max-width: 420px) {
        .site-name { font-size: 16px !important; }
        .nav-links { gap: 3px !important; }
        .nav-links button { padding: 5px 6px; font-size: 12px; }
      }
      /* 아주 좁은 폰(<375px: 360px 갤럭시, 344px 폴드 바깥 화면). 위 크기로도 「원기옥」이 화면 밖으로
         나가서(360px 8px, 344px 24px) 로고·간격·버튼 여백을 조금씩 더 줄인다. 글자 크기는 그대로. */
      @media (max-width: 374px) {
        nav { padding-left: 10px !important; padding-right: 10px !important; }
        .nav-home { gap: 7px !important; }
        .nav-logo { width: 32px !important; height: 32px !important; }
        .site-name { font-size: 15px !important; }
        .nav-links { gap: 2px !important; }
        .nav-links button { padding: 5px 4px; }
      }
    `}</style>
  );
}
