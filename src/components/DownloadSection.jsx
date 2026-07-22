import { C, serif, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

export default function DownloadSection({
  items,
  heading = "패치 다운로드",
  eyebrow = "Download",
  id = "download",
} = {}) {
  const downloads = items || content.downloads || [];
  return (
    <section
      id={id}
      style={{
        background: C.ink2,
        borderTop: `1px solid ${C.line}`,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "56px 22px" }}>
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
        <h2
          style={{
            fontFamily: serif,
            color: C.gold,
            fontSize: "clamp(22px,3.5vw,32px)",
            margin: "0 0 24px",
            fontWeight: 700,
          }}
        >
          {heading}
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          {downloads.map((d, i) => {
            // 버전이 숫자로 시작할 때만 "v" 접두사 (예: 70 → v70). "준비중입니다" 같은 글자는 그대로.
            const ver = d.version
              ? /^\d/.test(d.version)
                ? `v${d.version}`
                : d.version
              : null;
            const meta = [ver, d.date, d.size].filter(Boolean).join(" · ");
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                  backgroundColor: C.paper,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: "22px 24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* d.bg 가 있으면 원작 타이틀 화면을 카드 전체 배경으로 깐다.
                    sepia 로 사이트 톤에 맞추고, 위에 카드색 막을 덮어 글자 가독성을 지킨다. */}
                {d.bg && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${asset(d.bg)})`,
                        backgroundSize: "cover",
                        // 그림마다 잘 보이는 띠가 달라서 항목별로 bgPos 로 조정한다.
                        backgroundPosition: d.bgPos || "center 35%",
                        filter: "sepia(0.45) saturate(0.8) brightness(0.9)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(90deg, rgba(42,36,27,0.86) 0%, rgba(42,36,27,0.78) 100%)",
                        pointerEvents: "none",
                      }}
                    />
                  </>
                )}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontFamily: serif, color: C.gold, fontSize: 20 }}>
                    {d.title}
                  </div>
                  {d.subtitle && (
                    <div
                      style={{
                        color: C.goldDim,
                        fontSize: 12,
                        letterSpacing: 1,
                        marginTop: 3,
                        textTransform: "uppercase",
                      }}
                    >
                      {d.subtitle}
                    </div>
                  )}
                  <div style={{ color: C.textDim, fontSize: 13, marginTop: 6 }}>
                    {meta || "준비 중"}
                  </div>
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  {d.url ? (
                    <CTA primary href={d.url}>
                      ↓ 다운로드
                    </CTA>
                  ) : (
                    // url이 비어 있으면(아직 미배포) 클릭 안 되는 '준비 중' 표시
                    <span
                      style={{
                        padding: "12px 26px",
                        borderRadius: 8,
                        fontSize: 15,
                        fontWeight: 600,
                        letterSpacing: 1,
                        color: C.textDim,
                        background: "rgba(20,16,11,0.4)",
                        border: `1px dashed ${C.line}`,
                        display: "inline-block",
                        cursor: "default",
                      }}
                    >
                      준비 중
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p
          style={{
            color: C.textDim,
            fontSize: 12,
            marginTop: 14,
            lineHeight: 1.7,
          }}
        >
          설치 전 원본 게임 백업을 권장합니다.
        </p>
      </div>
    </section>
  );
}
