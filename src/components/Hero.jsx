import { C, asset } from "../theme.js";
import { CTA } from "./ui.jsx";
import content from "../content.json";

export default function Hero({ setView }) {
  const reportUrl = content.site.reportUrl;
  return (
    <header style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* 액자형 원본 그림을 '잘라내지 않고' 통째로 표시.
            세로는 화면 높이에 맞춰 축소(가로 잘림 방지), 가로는 100%까지.
            → 어떤 화면 너비에서도 "방랑자" 글씨가 잘리지 않음. */}
        <img
          src={asset("images/hero.jpg")}
          alt="한글패치 by 방랑자"
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
          {reportUrl ? (
            <CTA href={reportUrl}>오류 제보</CTA>
          ) : (
            <CTA
              onClick={() =>
                alert(
                  "오류 제보 폼이 아직 연결되지 않았습니다.\ncontent.json 의 site.reportUrl 에 구글 폼 주소를 넣으면 이 버튼이 폼으로 연결됩니다."
                )
              }
            >
              오류 제보
            </CTA>
          )}
          <CTA onClick={() => setView("workspace")}>작업공간 →</CTA>
        </div>
      </div>
    </header>
  );
}
