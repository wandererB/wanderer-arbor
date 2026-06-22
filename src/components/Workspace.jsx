import { useState } from "react";
import { C, serif } from "../theme.js";
import Dashboard from "./Dashboard.jsx";
import Notes from "./Notes.jsx";
import Research from "./Research.jsx";

export default function Workspace() {
  const [tab, setTab] = useState("dash"); // dash | notes | research
  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 22px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: C.goldDim,
            border: `1px solid ${C.line}`,
            padding: "3px 9px",
            borderRadius: 20,
          }}
        >
          PRIVATE · 로컬 전용
        </span>
      </div>
      <h2 style={{ fontFamily: serif, color: C.gold, fontSize: 28, margin: "0 0 6px" }}>
        작업공간
      </h2>
      <p
        style={{
          color: C.textDim,
          fontSize: 13,
          margin: "0 0 24px",
          lineHeight: 1.7,
        }}
      >
        입력한 데이터는 이 브라우저 안에만 저장되며(IndexedDB) 서버로 전송되지 않습니다.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 26, flexWrap: "wrap" }}>
        <WsTab active={tab === "dash"} onClick={() => setTab("dash")}>
          진행률 대시보드
        </WsTab>
        <WsTab active={tab === "notes"} onClick={() => setTab("notes")}>
          메모 · 이슈
        </WsTab>
        <WsTab active={tab === "research"} onClick={() => setTab("research")}>
          연구 노트
        </WsTab>
      </div>
      {tab === "dash" && <Dashboard />}
      {tab === "notes" && <Notes />}
      {tab === "research" && <Research />}
    </div>
  );
}

function WsTab({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 15px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        background: active ? C.paper : "transparent",
        color: active ? C.gold : C.textDim,
        border: `1px solid ${active ? C.goldDim : C.line}`,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}
