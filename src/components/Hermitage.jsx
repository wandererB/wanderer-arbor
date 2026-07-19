import { C, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import DownloadSection from "./DownloadSection.jsx";
import content from "../content.json";

// 「방랑자 암자」 — 마장기신 메인과 별개인 곁방 페이지. 첫 손님은 열혈시대극 한글패치.
export default function Hermitage({ setView }) {
  const h = content.hermitage || {};
  return (
    <>
      {/* 히어로: 2번째 이미지(public/images/hermitage.jpg).
          아직 파일이 없으면 기존 banner.jpg 로 자동 폴백 → 깨진 이미지 방지. */}
      <header style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ textAlign: "center" }}>
          <img
            src={asset("images/hermitage.jpg")}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = asset("images/banner.jpg");
            }}
            alt="방랑자 암자"
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
        {/* 히어로 아래 버튼 영역 */}
        <div style={{ textAlign: "center", padding: "8px 20px 28px" }}>
          {h.heroSubtitle && (
            <p
              style={{
                color: C.goldDim,
                letterSpacing: 6,
                fontSize: 12,
                margin: "0 0 18px",
                textTransform: "uppercase",
              }}
            >
              {h.heroSubtitle}
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
                  .getElementById("hermitage-download")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              열혈시대극 패치받기
            </CTA>
            <CTA onClick={() => setView("home")}>← 그늘쉼터로 돌아가기</CTA>
          </div>
        </div>
      </header>

      {/* 소개문 */}
      {h.intro && (
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "4px 22px 0" }}>
          <p
            style={{
              color: C.text,
              fontSize: 16,
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            {h.intro}
          </p>
        </section>
      )}

      {/* 다운로드(열혈시대극) — 홈의 DownloadSection 재사용 */}
      <DownloadSection
        items={h.downloads}
        heading="열혈시대극 패치"
        eyebrow="Hermitage"
        id="hermitage-download"
      />
    </>
  );
}
