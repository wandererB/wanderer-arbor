import { C, serif } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

export default function DownloadSection() {
  const downloads = content.downloads || [];
  return (
    <section
      id="download"
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
          Download
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
          패치 다운로드
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          {downloads.map((d, i) => {
            const meta = [d.version && `v${d.version}`, d.date, d.size]
              .filter(Boolean)
              .join(" · ");
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                  background: C.paper,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: "22px 24px",
                }}
              >
                <div>
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
                {d.url ? (
                  <CTA primary href={d.url}>
                    ↓ 다운로드
                  </CTA>
                ) : (
                  <CTA
                    primary
                    onClick={() =>
                      alert(
                        `${d.title}의 다운로드 링크가 아직 설정되지 않았습니다.\nsrc/content.json 의 해당 항목 "url" 에 GitHub Releases 주소를 넣으면 버튼이 실제 링크로 바뀝니다.`
                      )
                    }
                  >
                    ↓ 다운로드
                  </CTA>
                )}
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
          설치 전 원본 게임 백업을 권장합니다. 각 패치의 <code>url</code>을 GitHub
          Releases 링크로 채우면 버튼이 실제 다운로드로 연결됩니다.
        </p>
      </div>
    </section>
  );
}
