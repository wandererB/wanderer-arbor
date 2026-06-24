import { useState } from "react";
import { C } from "../theme.js";
import content from "../content.json";

// 메인 상단 공지 배너.
// content.json 의 notice(show/text/link/linkLabel)로 제어.
// 방문자가 닫으면 그 문구는 다시 안 뜨고, 새 공지(문구 변경)면 다시 뜸(localStorage).
export default function NoticeBanner() {
  const notice = content.notice;
  const text = notice && notice.show && notice.text ? notice.text : "";
  const KEY = "wanderer:notice:dismissed";

  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!text && localStorage.getItem(KEY) === text;
    } catch {
      return false;
    }
  });

  if (!text || dismissed) return null;

  function close() {
    try {
      localStorage.setItem(KEY, text);
    } catch {
      /* noop */
    }
    setDismissed(true);
  }

  return (
    <div
      style={{
        position: "relative",
        background:
          "linear-gradient(90deg, rgba(232,213,160,0.13), rgba(232,213,160,0.05))",
        borderBottom: `1px solid ${C.line}`,
        padding: "11px 42px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          verticalAlign: "middle",
          fontSize: 11,
          letterSpacing: 1,
          color: C.ink,
          background: C.gold,
          padding: "2px 9px",
          borderRadius: 20,
          fontWeight: 700,
          marginRight: 10,
          whiteSpace: "nowrap",
        }}
      >
        공지
      </span>
      <span
        style={{
          verticalAlign: "middle",
          color: C.sepia,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        {text}
        {notice.link && (
          <a
            href={notice.link}
            target="_blank"
            rel="noreferrer"
            style={{ color: C.gold, marginLeft: 8, fontWeight: 600 }}
          >
            {notice.linkLabel || "자세히 →"}
          </a>
        )}
      </span>
      <button
        onClick={close}
        aria-label="공지 닫기"
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: C.textDim,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
