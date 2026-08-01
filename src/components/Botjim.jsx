import { C, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import DownloadSection from "./DownloadSection.jsx";
import content from "../content.json";

// 「방랑자 봇짐」 — 한글패치가 아닌 도구/유틸리티 배포 공간. 기존 작업공간을 대체한다.
export default function Botjim({ setView }) {
  const b = content.botjim || {};
  return (
    <>
      {/* 히어로: 봇짐을 멘 방랑자(botzim.jpg). 없으면 banner.jpg 로 폴백. */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ textAlign: "center" }}>
          <img
            src={asset("images/botzim.jpg")}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = asset("images/banner.jpg");
            }}
            alt="방랑자 봇짐"
            style={{
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
              maxHeight: "88vh",
              height: "auto",
              filter: "saturate(0.95)",
            }}
          />
        </div>
        <div style={{ textAlign: "center", padding: "8px 20px 28px" }}>
          {b.heroSubtitle && (
            <p
              style={{
                color: C.goldDim,
                letterSpacing: 6,
                fontSize: 12,
                margin: "0 0 18px",
                textTransform: "uppercase",
              }}
            >
              {b.heroSubtitle}
            </p>
          )}
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
                  .getElementById("botjim-download")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              봇짐 열기
            </CTA>
            <CTA onClick={() => setView("home")}>← 그늘쉼터로 돌아가기</CTA>
          </div>
        </div>
      </header>

      {b.intro && (
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "4px 22px 0" }}>
          <p
            style={{
              color: C.text,
              fontSize: 16,
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            {b.intro}
          </p>
        </section>
      )}

      {/* 도구·유틸리티 목록 — 홈의 DownloadSection 재사용 */}
      <DownloadSection
        items={b.downloads}
        heading="방랑자 봇짐"
        eyebrow="Bindle"
        id="botjim-download"
      />
    </>
  );
}
