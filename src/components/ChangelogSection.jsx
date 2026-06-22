import { C, serif } from "../theme.js";
import { Section } from "./ui.jsx";
import content from "../content.json";

export default function ChangelogSection() {
  return (
    <Section eyebrow="Changelog" title="변경 이력">
      <div style={{ position: "relative", paddingLeft: 26 }}>
        <div
          style={{
            position: "absolute",
            left: 6,
            top: 6,
            bottom: 6,
            width: 2,
            background: C.line,
          }}
        />
        {content.changelog.map((c, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 30 }}>
            <div
              style={{
                position: "absolute",
                left: -26,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: i === 0 ? C.gold : C.paper,
                border: `2px solid ${C.gold}`,
              }}
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontFamily: serif,
                  color: C.gold,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {c.date}
              </span>
            </div>
            <ul
              style={{
                margin: "8px 0 0",
                paddingLeft: 18,
                color: C.text,
                lineHeight: 1.8,
                fontSize: 14,
              }}
            >
              {c.notes.map((n, j) => (
                <li key={j}>{n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
