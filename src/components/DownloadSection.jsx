import { C, serif } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

export default function DownloadSection() {
  const { title } = content.patch;
  const { version, date, size, url } = content.download;
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
        <div
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
              {title} v{version}
            </div>
            <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>
              최신 빌드 · {date} · {size}
            </div>
          </div>
          {url ? (
            <CTA primary href={url}>
              ↓ 다운로드
            </CTA>
          ) : (
            <CTA
              primary
              onClick={() =>
                alert(
                  "아직 다운로드 링크가 설정되지 않았습니다.\nsrc/content.json 의 download.url 에 GitHub Releases 주소를 넣으면 이 버튼이 링크로 바뀝니다."
                )
              }
            >
              ↓ 다운로드
            </CTA>
          )}
        </div>
        <p
          style={{
            color: C.textDim,
            fontSize: 12,
            marginTop: 14,
            lineHeight: 1.7,
          }}
        >
          설치 전 원본 게임 백업을 권장합니다. 배포 시 <code>content.json</code>의{" "}
          <code>download.url</code>을 GitHub Releases 링크로 채우면 됩니다.
        </p>
      </div>
    </section>
  );
}
