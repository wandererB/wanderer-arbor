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
        <span style={{ fontSize: 19, letterSpacing: 1 }}>{content.site.name}</span>
      </button>
      <div style={{ display: "flex", gap: 6 }}>
        <NavBtn active={view === "home"} onClick={() => setView("home")}>
          패치
        </NavBtn>
        <NavBtn active={view === "workspace"} onClick={() => setView("workspace")}>
          작업공간
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
        padding: "8px 16px",
        borderRadius: 6,
        cursor: "pointer",
        fontFamily: sans,
        fontSize: 14,
        letterSpacing: 0.5,
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
