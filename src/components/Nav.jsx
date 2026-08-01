import { C, serif, sans, asset } from "../theme.js";
import content from "../content.json";

export default function Nav({ view, setView }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 22px",
        background: "rgba(18,15,11,0.82)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <button
        onClick={() => setView("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.gold,
          fontFamily: serif,
        }}
      >
        <img
          src={asset("images/logo.png")}
          alt="방랑자"
          style={{ width: 38, height: 38, borderRadius: "50%" }}
        />
        {/* 사이트명: 데스크톱은 한 줄, 모바일은 공백에서 두 줄(방랑자의 / 그늘쉼터).
            keep-all 로 낱말 중간(그늘쉼|터) 깨짐 방지. 분리는 content.site.name 의 공백 기준. */}
        <span
          className="site-name"
          style={{
            fontSize: 19,
            letterSpacing: 1,
            whiteSpace: "nowrap",
            wordBreak: "keep-all",
            lineHeight: 1.15,
            textAlign: "left",
          }}
        >
          {content.site.name.split(" ").map((part, i) => (
            <span key={i} className="site-name-part">
              {i > 0 ? " " : ""}
              {part}
            </span>
          ))}
        </span>
      </button>
      <div
        className="nav-links"
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <NavBtn active={view === "home"} onClick={() => setView("home")}>
          패치
        </NavBtn>
        <NavBtn active={view === "hermitage"} onClick={() => setView("hermitage")}>
          암자
        </NavBtn>
        <NavBtn active={view === "botjim"} onClick={() => setView("botjim")}>
          봇짐
        </NavBtn>
        <NavBtn active={view === "guestbook"} onClick={() => setView("guestbook")}>
          방명록
        </NavBtn>
      </div>
    </nav>
  );
}

function NavBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: sans,
        whiteSpace: "nowrap",
        background: active ? C.gold : "transparent",
        color: active ? C.ink : C.textDim,
        border: `1px solid ${active ? C.gold : C.line}`,
        fontWeight: active ? 700 : 500,
        transition: "all .2s",
      }}
    >
      {children}
    </button>
  );
}
