import { C, asset } from "../theme.js";

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, marginTop: 40 }}>
      <img
        src={asset("images/banner.jpg")}
        alt="WANDERER"
        style={{
          width: "100%",
          display: "block",
          opacity: 0.85,
          maskImage: "linear-gradient(180deg, transparent, #000 30%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, #000 30%)",
        }}
      />
      <div style={{ textAlign: "center", padding: "24px 20px 40px" }}>
        <p style={{ color: C.textDim, fontSize: 12, lineHeight: 1.8 }}>
          한글패치 by 방랑자 · 비공식 팬 번역 프로젝트
          <br />본 사이트의 데이터는 브라우저 안에서만 처리됩니다.
        </p>
      </div>
    </footer>
  );
}
