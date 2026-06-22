import { C, serif } from "../theme.js";
import { RESEARCH } from "../workspaceData.js";

// ---- 연구 노트 ----
export default function Research() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
        gap: 18,
      }}
    >
      {RESEARCH.map((c, i) => (
        <div
          key={i}
          style={{
            background: C.ink2,
            border: `1px solid ${C.line}`,
            borderRadius: 12,
            padding: 22,
          }}
        >
          <h3
            style={{
              fontFamily: serif,
              color: C.gold,
              fontSize: 19,
              margin: "0 0 8px",
            }}
          >
            {c.t}
          </h3>
          <p
            style={{
              color: C.textDim,
              fontSize: 13,
              lineHeight: 1.7,
              margin: "0 0 14px",
            }}
          >
            {c.d}
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              color: C.text,
              fontSize: 14,
              lineHeight: 1.9,
            }}
          >
            {c.items.map((x, j) => (
              <li key={j}>{x}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
