import { C, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

export default function Hero({ setView }) {
  return (
    <header style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative" }}>
        <img
          src={asset("images/hero.jpg")}
          alt="한글패치 by 방랑자"
          style={{
            width: "100%",
            display: "block",
            objectFit: "cover",
            maxHeight: "82vh",
            filter: "saturate(0.95)",
          }}
        />
        {/* 하단 가장자리만 살짝 페이드 — 인물/원본 글씨는 가리지 않음 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "22%",
            background: `linear-gradient(180deg, transparent, ${C.ink})`,
            pointerEvents: "none",
          }}
        />
      </div>
      {/* 버튼은 이미지 아래 별도 영역 */}
      <div style={{ textAlign: "center", padding: "8px 20px 40px" }}>
        <p
          style={{
            color: C.goldDim,
            letterSpacing: 6,
            fontSize: 12,
            margin: "0 0 18px",
            textTransform: "uppercase",
          }}
        >
          {content.patch.subtitle}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <CTA
            primary
            onClick={() =>
              document
                .getElementById("download")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            패치 받기
          </CTA>
          <CTA onClick={() => setView("workspace")}>작업공간 →</CTA>
        </div>
      </div>
    </header>
  );
}
