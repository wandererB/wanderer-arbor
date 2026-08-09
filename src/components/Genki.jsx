import { C, serif, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

// 「원기옥」 — 후원(커피 한잔 응원) 페이지. litt.ly 레이아웃을 사이트 세피아 톤으로.
// ⚠문구는 자료(한글패치)와 돈을 직접 엮지 않는 안전한 표현만 사용(원기옥.txt 지침).
//   "제작비/번역 비용에 사용", "후원자 요청 게임 우선 작업" 류 표현 금지.
export default function Genki({ setView }) {
  const g = content.genki || {};
  const lines = g.lines || [];
  return (
    <section
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "56px 22px 72px",
        textAlign: "center",
      }}
    >
      <img
        src={asset("images/logo.png")}
        alt="방랑자"
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          border: `1px solid ${C.line}`,
          margin: "0 auto 20px",
          display: "block",
        }}
      />
      {g.eyebrow && (
        <p
          style={{
            color: C.goldDim,
            letterSpacing: 5,
            fontSize: 12,
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          {g.eyebrow}
        </p>
      )}
      <h2
        style={{
          fontFamily: serif,
          color: C.gold,
          fontSize: "clamp(23px,3.4vw,31px)",
          fontWeight: 700,
          margin: "0 0 22px",
        }}
      >
        {g.title}
      </h2>

      <div
        style={{
          background: C.ink2,
          border: `1px solid ${C.line}`,
          borderRadius: 14,
          padding: "24px 22px",
        }}
      >
        {lines.map((ln, i) => (
          <p
            key={i}
            style={{
              color: i === lines.length - 1 ? C.gold : C.text,
              fontSize: 15,
              lineHeight: 1.85,
              margin: i === lines.length - 1 ? "10px 0 0" : "0 0 12px",
            }}
          >
            {ln}
          </p>
        ))}
      </div>

      <div style={{ marginTop: 26 }}>
        {g.url ? (
          <CTA primary href={g.url}>
            {g.buttonLabel}
          </CTA>
        ) : (
          // url 미연결(준비중): 클릭 안 되는 표시
          <span
            style={{
              display: "inline-block",
              padding: "12px 26px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: 1,
              color: C.textDim,
              background: "rgba(20,16,11,0.4)",
              border: `1px dashed ${C.line}`,
              cursor: "default",
            }}
          >
            {g.buttonLabel} (링크 연결 예정)
          </span>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <CTA onClick={() => setView("home")}>← 그늘쉼터로 돌아가기</CTA>
      </div>
    </section>
  );
}
