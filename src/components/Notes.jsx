import { useState, useEffect } from "react";
import { C } from "../theme.js";
import { inputStyle } from "./ui.jsx";
import { SEED_NOTES } from "../workspaceData.js";
import { loadNotes, saveNotes } from "../db.js";

// ---- 메모 / 이슈 보드 ----
// 항목은 IndexedDB(idb-keyval)에 저장되어 새로고침해도 유지됩니다.
export default function Notes() {
  const [items, setItems] = useState(null); // null = 로딩 중
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("메모");
  const tags = ["메모", "이슈", "연구"];
  const tagColor = { 메모: C.sepia, 이슈: "#d98a6a", 연구: C.goldDim };

  // 최초 로드: 저장된 값이 있으면 사용, 없으면 시드.
  useEffect(() => {
    let alive = true;
    loadNotes().then((stored) => {
      if (alive) setItems(stored ?? SEED_NOTES);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 변경 시 영속화 (로딩 완료 후에만).
  useEffect(() => {
    if (items !== null) saveNotes(items);
  }, [items]);

  function add() {
    if (!title.trim()) return;
    setItems([
      { id: Date.now(), tag, title: title.trim(), body: body.trim(), done: false },
      ...items,
    ]);
    setTitle("");
    setBody("");
  }
  function toggle(id) {
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function del(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  if (items === null) {
    return (
      <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
        불러오는 중…
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          background: C.ink2,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                background: tag === t ? tagColor[t] : "transparent",
                color: tag === t ? C.ink : C.textDim,
                border: `1px solid ${tag === t ? tagColor[t] : C.line}`,
                fontWeight: tag === t ? 700 : 500,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          onKeyDown={(e) => e.key === "Enter" && add()}
          style={inputStyle}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용 (선택)"
          rows={2}
          style={{ ...inputStyle, marginTop: 8, resize: "vertical" }}
        />
        <button
          onClick={add}
          style={{
            marginTop: 10,
            padding: "9px 18px",
            borderRadius: 8,
            cursor: "pointer",
            background: C.gold,
            color: C.ink,
            fontWeight: 600,
            border: "none",
            fontSize: 14,
          }}
        >
          추가
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              background: C.ink2,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "14px 16px",
              opacity: it.done ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={it.done}
              onChange={() => toggle(it.id)}
              style={{
                marginTop: 4,
                accentColor: C.gold,
                width: 16,
                height: 16,
                cursor: "pointer",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: C.paper,
                    color: tagColor[it.tag] || C.textDim,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {it.tag}
                </span>
                <span
                  style={{
                    color: C.text,
                    fontWeight: 600,
                    textDecoration: it.done ? "line-through" : "none",
                  }}
                >
                  {it.title}
                </span>
              </div>
              {it.body && (
                <p
                  style={{
                    color: C.textDim,
                    fontSize: 13,
                    margin: "6px 0 0",
                    lineHeight: 1.6,
                  }}
                >
                  {it.body}
                </p>
              )}
            </div>
            <button
              onClick={() => del(it.id)}
              style={{
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
        ))}
        {items.length === 0 && (
          <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
            항목이 없습니다. 위에서 추가해 보세요.
          </p>
        )}
      </div>
    </div>
  );
}
