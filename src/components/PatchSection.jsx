import { C } from "../theme.js";
import { Section } from "./ui.jsx";
import content from "../content.json";

export default function PatchSection() {
  const { intro } = content.patch;
  return (
    <Section eyebrow="About" title="이 패치에 대하여">
      <p style={{ color: C.text, lineHeight: 1.9, fontSize: 16, maxWidth: 680 }}>
        {intro}
      </p>
    </Section>
  );
}
