import { C, serif } from "../theme.js";
import { Section } from "./ui.jsx";
import content from "../content.json";

export default function PatchSection() {
  const { intro, stats } = content.patch;
  return (
    <Section eyebrow="About" title="이 패치에 대하여">
      <p style={{ color: C.text, lineHeight: 1.9, fontSize: 16, maxWidth: 680 }}>
        {intro}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
          marginTop: 32,
        }}
      >
        {stats.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.ink2,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "22px 20px",
            }}
          >
            <div
              style={{
                fontFamily: serif,
                color: C.gold,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {s.n}
            </div>
            <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
