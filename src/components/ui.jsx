import { C, serif, sans } from "../theme.js";

// ---- 공통 버튼 / 링크 (CTA) ----
export function CTA({ children, primary, onClick, href }) {
  const style = {
    padding: "12px 26px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: sans,
    fontSize: 15,
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
      <a href={href} target="_blank" rel="noreferrer" style={style} {...press}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} style={style} {...press}>
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
    `}</style>
  );
}
