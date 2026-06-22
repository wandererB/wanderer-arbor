import { useState } from "react";
import { C, serif } from "../theme.js";
import { Stat } from "./ui.jsx";

// ---- CSV 진행률 대시보드 ----
// 파일은 업로드되지 않고 브라우저(FileReader) 안에서만 분석됩니다.
export default function Dashboard() {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  function parseCSV(text) {
    // 간단한 CSV 파서 (따옴표 안의 콤마/개행 처리)
    const out = [];
    let row = [],
      cur = "",
      q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cur += '"';
            i++;
          } else q = false;
        } else cur += ch;
      } else {
        if (ch === '"') q = true;
        else if (ch === ",") {
          row.push(cur);
          cur = "";
        } else if (ch === "\n") {
          row.push(cur);
          out.push(row);
          row = [];
          cur = "";
        } else if (ch === "\r") {
          /* skip */
        } else cur += ch;
      }
    }
    if (cur.length || row.length) {
      row.push(cur);
      out.push(row);
    }
    return out.filter(
      (r) => r.length > 1 || (r.length === 1 && r[0].trim() !== "")
    );
  }

  function analyze(text, name) {
    try {
      const grid = parseCSV(text);
      if (grid.length < 2) {
        setError("행이 충분하지 않습니다.");
        return;
      }
      const header = grid[0].map((h) => h.trim().toLowerCase());
      const body = grid.slice(1);
      // 번역 컬럼 추정: ko/kr/번역/target 등
      const koIdx = header.findIndex((h) =>
        /ko|kr|korean|번역|translation|target|tgt/.test(h)
      );
      const jpIdx = header.findIndex((h) =>
        /ja|jp|japanese|원문|source|src/.test(h)
      );
      const ti = koIdx >= 0 ? koIdx : grid[0].length - 1;
      let translated = 0,
        empty = 0,
        ctrlOnly = 0;
      const ctrlRe = /<C0[0-9A-Fa-f]+>|\{[0-9A-Fa-f]{2}\}/g;
      for (const r of body) {
        const cell = (r[ti] || "").trim();
        const stripped = cell.replace(ctrlRe, "").trim();
        if (stripped.length === 0) {
          if (cell.length > 0) ctrlOnly++;
          else empty++;
        } else translated++;
      }
      const total = body.length;
      setRows({
        total,
        translated,
        empty,
        ctrlOnly,
        pct: total ? Math.round((translated / total) * 1000) / 10 : 0,
        koCol: ti >= 0 ? grid[0][ti] || `열 ${ti + 1}` : "?",
        jpCol: jpIdx >= 0 ? grid[0][jpIdx] : null,
      });
      setFileName(name);
      setError("");
    } catch {
      setError("CSV 파싱 중 오류가 발생했습니다.");
    }
  }

  function onFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => analyze(e.target.result, file.name);
    reader.readAsText(file, "utf-8");
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: `2px dashed ${drag ? C.gold : C.line}`,
          borderRadius: 14,
          padding: "44px 24px",
          textAlign: "center",
          background: drag ? "rgba(232,213,160,0.05)" : C.ink2,
          transition: "all .2s",
        }}
      >
        <div
          style={{
            fontFamily: serif,
            color: C.gold,
            fontSize: 18,
            marginBottom: 8,
          }}
        >
          번역 CSV를 여기로 끌어다 놓으세요
        </div>
        <div style={{ color: C.textDim, fontSize: 13, marginBottom: 18 }}>
          파일은 업로드되지 않고 브라우저 안에서만 분석됩니다
        </div>
        <label
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            background: C.gold,
            color: C.ink,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          파일 선택
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files[0])}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: "#d98a6a", marginTop: 16, fontSize: 14 }}>{error}</p>
      )}

      {rows && (
        <div style={{ marginTop: 28 }}>
          <div style={{ color: C.textDim, fontSize: 13, marginBottom: 14 }}>
            <b style={{ color: C.sepia }}>{fileName}</b> · 번역 열 추정:{" "}
            <b style={{ color: C.sepia }}>{rows.koCol}</b>
            {rows.jpCol && <> · 원문 열: {rows.jpCol}</>}
          </div>

          {/* 진행률 바 */}
          <div
            style={{
              background: C.paper,
              borderRadius: 12,
              padding: 22,
              border: `1px solid ${C.line}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <span style={{ color: C.text, fontSize: 14 }}>번역 진행률</span>
              <span
                style={{
                  fontFamily: serif,
                  color: C.gold,
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {rows.pct}%
              </span>
            </div>
            <div
              style={{
                height: 14,
                borderRadius: 8,
                background: C.ink,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${rows.pct}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`,
                  transition: "width .6s",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
              gap: 14,
              marginTop: 16,
            }}
          >
            <Stat label="전체 행" v={rows.total.toLocaleString()} />
            <Stat label="번역 완료" v={rows.translated.toLocaleString()} color={C.gold} />
            <Stat label="미번역(빈 행)" v={rows.empty.toLocaleString()} color="#d98a6a" />
            <Stat
              label="제어코드만 있음"
              v={rows.ctrlOnly.toLocaleString()}
              color={C.sepiaDim}
            />
          </div>
          <p
            style={{
              color: C.textDim,
              fontSize: 12,
              marginTop: 14,
              lineHeight: 1.7,
            }}
          >
            번역 열은 헤더 이름(ko/kr/번역/target 등)으로 자동 추정합니다. 빗나가면
            헤더명을 맞춰주세요. 제어코드(<code>&lt;C0xxx&gt;</code>,{" "}
            <code>{"{1F}"}</code>)만 있는 행은 따로 집계합니다.
          </p>
        </div>
      )}
    </div>
  );
}
