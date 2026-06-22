import { useState, useEffect } from "react";
import { C, serif } from "../theme.js";
import { Section, inputStyle } from "./ui.jsx";
import content from "../content.json";
import { db, firebaseReady } from "../firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

function fmt(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export default function Guestbook() {
  const intro = content.guestbook && content.guestbook.intro;
  const [messages, setMessages] = useState(null); // null = 로딩
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebaseReady) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setError("메시지를 불러오지 못했습니다.")
    );
    return () => unsub();
  }, []);

  async function send() {
    const m = msg.trim();
    if (!m) return;
    if (m.length > 500) {
      setError("메시지는 500자 이내로 남겨주세요.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await addDoc(collection(db, "guestbook"), {
        name: (name.trim() || "익명").slice(0, 30),
        message: m,
        createdAt: serverTimestamp(),
      });
      setMsg("");
    } catch (e) {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  // Firebase 미설정 시 안내
  if (!firebaseReady) {
    return (
      <Section eyebrow="Guestbook" title="방명록">
        <div
          style={{
            background: C.ink2,
            border: `1px dashed ${C.line}`,
            borderRadius: 12,
            padding: "32px 24px",
            textAlign: "center",
            color: C.textDim,
            lineHeight: 1.7,
          }}
        >
          방명록 준비 중입니다.
          <br />
          (Firebase 연결 후 열립니다.)
        </div>
      </Section>
    );
  }

  return (
    <Section eyebrow="Guestbook" title="방명록">
      {intro && (
        <p
          style={{
            color: C.textDim,
            fontSize: 14,
            lineHeight: 1.8,
            margin: "0 0 22px",
          }}
        >
          {intro}
        </p>
      )}

      {/* 작성 폼 */}
      <div
        style={{
          background: C.ink2,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 26,
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 (선택)"
          maxLength={30}
          style={inputStyle}
        />
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="응원 한마디를 남겨주세요…"
          rows={3}
          maxLength={500}
          style={{ ...inputStyle, marginTop: 8, resize: "vertical" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <span style={{ color: C.textDim, fontSize: 12 }}>{msg.length}/500</span>
          <button
            onClick={send}
            disabled={sending || !msg.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              cursor: sending || !msg.trim() ? "default" : "pointer",
              background: sending || !msg.trim() ? C.line : C.gold,
              color: C.ink,
              fontWeight: 600,
              border: "none",
              fontSize: 14,
            }}
          >
            {sending ? "남기는 중…" : "남기기"}
          </button>
        </div>
        {error && (
          <p style={{ color: "#d98a6a", fontSize: 13, marginTop: 10 }}>{error}</p>
        )}
      </div>

      {/* 메시지 목록 */}
      {messages === null ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          불러오는 중…
        </p>
      ) : messages.length === 0 ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          아직 메시지가 없습니다. 첫 응원을 남겨주세요!
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                background: C.ink2,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    color: C.gold,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {m.name || "익명"}
                </span>
                <span style={{ color: C.textDim, fontSize: 12 }}>
                  {fmt(m.createdAt)}
                </span>
              </div>
              <p
                style={{
                  color: C.text,
                  fontSize: 14,
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
