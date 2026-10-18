import { useState } from "react";
import { C, serif, sans, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

// 방문자가 고른 보기(목록/바둑판)를 섹션 id 별로 기억한다.
// 아직 안 골랐거나, 저장소를 못 쓰거나(사생활 보호 창 등), 이상한 값이면 섹션 기본값으로 둔다.
const layoutKey = (id) => `wanderer:layout:${id}`;
function readLayout(id, fallback) {
  try {
    const v = localStorage.getItem(layoutKey(id));
    return v === "grid" || v === "list" ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function DownloadSection({
  items,
  heading = "패치 다운로드",
  eyebrow = "Download",
  id = "download",
  // allowGrid: 제목 옆에 「목록 / 바둑판」 토글을 단다. 작품이 많은 암자에서만 켠다.
  // 꺼져 있으면(홈) 토글도 없고 언제나 지금의 목록 보기다.
  allowGrid = false,
  // defaultLayout: 토글을 아직 안 눌러 본 방문자가 처음 보는 보기("list" | "grid").
  defaultLayout = "list",
} = {}) {
  const downloads = items || content.downloads || [];
  const [layout, setLayout] = useState(() =>
    allowGrid ? readLayout(id, defaultLayout) : "list"
  );
  const grid = allowGrid && layout === "grid";
  const pickLayout = (next) => {
    setLayout(next);
    try {
      localStorage.setItem(layoutKey(id), next);
    } catch {
      /* 저장이 안 되면 이번 방문 동안만 유지 */
    }
  };
  const title = (
    <h2
      style={{
        fontFamily: serif,
        color: C.gold,
        fontSize: "clamp(22px,3.5vw,32px)",
        margin: allowGrid ? 0 : "0 0 24px",
        fontWeight: 700,
      }}
    >
      {heading}
    </h2>
  );
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
        {allowGrid ? (
          // 제목은 왼쪽, 토글은 같은 줄 오른쪽 끝. 폭이 모자라면 토글이 아래로 내려간다.
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              margin: "0 0 24px",
            }}
          >
            {title}
            <LayoutToggle value={layout} onChange={pickLayout} />
          </div>
        ) : (
          title
        )}

        <div
          className={grid ? "dl-grid" : undefined}
          style={grid ? undefined : { display: "grid", gap: 16 }}
        >
          {downloads.map((d, i) => {
            // 버전이 숫자로 시작할 때만 "v" 접두사 (예: 70 → v70). "준비중입니다" 같은 글자는 그대로.
            const ver = d.version
              ? /^\d/.test(d.version)
                ? `v${d.version}`
                : d.version
              : null;
            const meta = [ver, d.date, d.size].filter(Boolean).join(" · ");
            // GitHub Releases는 에셋 1개당 2GiB가 하드 리밋이라,
            // 그보다 큰 패치는 7-Zip 분할(.001/.002…)로 올리고
            // content.json 에 parts[] 로 적어둔다. 그럴 때만 파트 버튼이 나온다.
            const parts = Array.isArray(d.parts) && d.parts.length ? d.parts : null;
            // variants[] 는 parts[] 와 반대다. 한 패치의 '둘 중 하나' 골라 받는 판본
            // (예: 428 의 스팀 번역판 / 자체 번역판). 전부 받는 게 아니라서 버튼에 이름을 적는다.
            const variants =
              !parts && Array.isArray(d.variants) && d.variants.length ? d.variants : null;
            const partsNote =
              parts &&
              (d.partsNote ||
                `용량이 커서 ${parts.length}개로 나눠 올렸습니다. 파트를 모두 같은 폴더에 받은 뒤 .001 파일을 7-Zip으로 열면 원래 파일로 합쳐집니다.`);
            if (grid) {
              return (
                <GridCard
                  key={i}
                  d={d}
                  meta={meta}
                  parts={parts}
                  partsNote={partsNote}
                  variants={variants}
                />
              );
            }
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
                      // bgPair: 같은 그림을 위아래 두 카드에 나눠 까는 경우(마장기신 3 Vita/PS3).
                      // PC 는 bgPos 로 맞추고, 모바일은 카드가 높아 ui.jsx 의 미디어 쿼리로 바꾼다.
                      className={[
                        d.bgPair && `bg-pair bg-pair-${d.bgPair}`,
                        // bgPosMobile: 모바일 카드는 PC 보다 훨씬 높아서(175 vs 111)
                        // 그림이 더 많이 보인다. 로고 아래 부제까지 넣고 싶을 때 쓴다.
                        d.bgPosMobile && "bg-mo",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined}
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${asset(d.bg)})`,
                        ...(d.bgPosMobile ? { "--bg-mo": d.bgPosMobile } : {}),
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
                  {/* 항목별 한 줄 안내 (예: 원작자 요청 시 내려갈 수 있음) */}
                  {d.note && (
                    <div style={{ color: C.sepiaDim, fontSize: 12, marginTop: 4 }}>
                      {d.note}
                    </div>
                  )}
                  {parts && (
                    <div
                      style={{
                        color: C.sepiaDim,
                        fontSize: 12,
                        lineHeight: 1.65,
                        marginTop: 8,
                        maxWidth: 430,
                      }}
                    >
                      {partsNote}
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  {variants ? (
                    // 정렬은 ui.jsx 의 .variant-pick 에서 (PC 오른쪽 / 모바일 왼쪽).
                    // '하나만' 이라고 막지 않는다 — 비교하려고 둘 다 받는 사람도 있다.
                    <div className="variant-pick">
                      <div
                        style={{
                          color: C.goldDim,
                          fontSize: 11,
                          letterSpacing: 1,
                          marginBottom: 8,
                          textTransform: "uppercase",
                        }}
                      >
                        ↓ 원하시는 걸 받으세요
                      </div>
                      <div
                        className="variant-buttons"
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {variants.map((v, j) => (
                          <CTA
                            key={j}
                            primary
                            small
                            href={v.url}
                            title={[v.label, v.size].filter(Boolean).join(" · ")}
                          >
                            {v.label || `판본 ${j + 1}`}
                          </CTA>
                        ))}
                      </div>
                    </div>
                  ) : parts ? (
                    // 파트 이름을 버튼마다 다 적으면 3개부터 2+1 로 어긋나게 줄바꿈된다.
                    // 번호만 단 칩으로 두고 설명은 위 한 줄에 몰아준다 → 개수가 늘어도 한 줄 유지.
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: C.goldDim,
                          fontSize: 11,
                          letterSpacing: 1,
                          marginBottom: 8,
                          textTransform: "uppercase",
                        }}
                      >
                        {`↓ 분할 다운로드 · ${parts.length}개 전부`}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        {parts.map((p, j) => (
                          <CTA
                            key={j}
                            primary
                            small
                            href={p.url}
                            title={[p.label || `파트 ${j + 1}`, p.size]
                              .filter(Boolean)
                              .join(" · ")}
                          >
                            {j + 1}
                          </CTA>
                        ))}
                      </div>
                    </div>
                  ) : d.url ? (
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

// ---- 「목록 / 바둑판」 보기 토글 ----
// 작은 2단 버튼. 고른 쪽만 금색으로 채운다(CTA primary 와 같은 색).
function LayoutToggle({ value, onChange }) {
  const options = [
    ["list", "목록"],
    ["grid", "바둑판"],
  ];
  return (
    <div
      role="group"
      aria-label="보기 방식"
      style={{
        display: "inline-flex",
        flexShrink: 0,
        border: `1px solid ${C.goldDim}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {options.map(([v, label], j) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            style={{
              padding: "6px 14px",
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 1,
              border: "none",
              borderLeft: j ? `1px solid ${C.goldDim}` : "none",
              background: on ? C.gold : "rgba(20,16,11,0.6)",
              color: on ? C.ink : C.goldDim,
              cursor: on ? "default" : "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---- 바둑판 보기 카드 ----
// 목록 카드를 세로로 접은 것: 그림 → 제목·부제·메타·안내 → 다운로드 버튼.
// 열 수와 휴대폰 글자 크기는 ui.jsx 의 .dl-grid 미디어 쿼리가 맡는다.
function GridCard({ d, meta, parts, partsNote, variants }) {
  const label = {
    color: C.goldDim,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        backgroundColor: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* 그림은 카드 위 띠에만 깐다. 글자가 그림 위에 오지 않으니 막은 아래쪽에만 살짝.
          bgPair·bgPosMobile 은 목록 카드 높이에 맞춘 값이라 여기선 bgPos 만 쓴다. */}
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: C.ink,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        {d.bg && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${asset(d.bg)})`,
                backgroundSize: "cover",
                backgroundPosition: d.bgPos || "center 35%",
                filter: "sepia(0.45) saturate(0.8) brightness(0.9)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(42,36,27,0) 55%, rgba(42,36,27,0.7) 100%)",
              }}
            />
          </>
        )}
      </div>
      <div
        className="dl-body"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          // 좁은 카드라 줄이 자주 바뀐다. 한글은 낱말 단위로 끊고("한글패/치" 방지),
          // 띄어쓰기 없는 긴 부제·안내만 어디서든 끊어서 카드 밖으로 안 나가게
          wordBreak: "keep-all",
          overflowWrap: "anywhere",
        }}
      >
        <div className="dl-title" style={{ fontFamily: serif, color: C.gold, lineHeight: 1.35 }}>
          {d.title}
        </div>
        {d.subtitle && (
          <div
            style={{
              color: C.goldDim,
              fontSize: 11,
              letterSpacing: 1,
              lineHeight: 1.45,
              marginTop: 4,
              textTransform: "uppercase",
            }}
          >
            {d.subtitle}
          </div>
        )}
        <div style={{ color: C.textDim, fontSize: 12, marginTop: 6 }}>{meta || "준비 중"}</div>
        {d.note && (
          <div style={{ color: C.sepiaDim, fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>
            {d.note}
          </div>
        )}
        {partsNote && (
          <div style={{ color: C.sepiaDim, fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
            {partsNote}
          </div>
        )}
        {/* 버튼은 카드 맨 아래에 붙인다 → 같은 줄 카드끼리 버튼 높이가 맞는다 */}
        <div style={{ marginTop: "auto", paddingTop: 14 }}>
          {variants ? (
            <>
              <div style={label}>↓ 원하시는 걸 받으세요</div>
              <div className="dl-fill">
                {variants.map((v, j) => (
                  <CTA
                    key={j}
                    primary
                    small
                    href={v.url}
                    title={[v.label, v.size].filter(Boolean).join(" · ")}
                  >
                    {v.label || `판본 ${j + 1}`}
                  </CTA>
                ))}
              </div>
            </>
          ) : parts ? (
            <>
              <div style={label}>{`↓ 분할 다운로드 · ${parts.length}개 전부`}</div>
              <div className="dl-fill dl-parts">
                {parts.map((p, j) => (
                  <CTA
                    key={j}
                    primary
                    small
                    href={p.url}
                    title={[p.label || `파트 ${j + 1}`, p.size].filter(Boolean).join(" · ")}
                  >
                    {j + 1}
                  </CTA>
                ))}
              </div>
            </>
          ) : d.url ? (
            <div className="dl-fill">
              <CTA primary small href={d.url}>
                ↓ 다운로드
              </CTA>
            </div>
          ) : (
            <span
              style={{
                display: "block",
                textAlign: "center",
                padding: "9px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 1,
                color: C.textDim,
                background: "rgba(20,16,11,0.4)",
                border: `1px dashed ${C.line}`,
                cursor: "default",
              }}
            >
              준비 중
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
