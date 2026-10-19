import { useState, useEffect, useRef } from "react";
import { C, serif } from "../theme.js";
import { Section, inputStyle, Pager, scrollToList } from "./ui.jsx";
import content from "../content.json";
import { db, firebaseReady } from "../firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { useAdmin, AdminFooter, textBtn } from "../admin.jsx";

const PER_PAGE = 10;

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
  const admin = useAdmin();
  const { isAdmin, setMsg: setAdminMsg } = admin;
  const [busyId, setBusyId] = useState("");
  const [replyFor, setReplyFor] = useState(""); // 답글 쓰는 중인 글 id
  const [replyText, setReplyText] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null); // 전체 글 수 (쪽 번호용)
  const listTop = useRef(null);

  useEffect(() => {
    if (!firebaseReady) {
      setMessages([]);
      return;
    }
    // 최신순으로 지금 쪽까지만 받아 그 쪽 몫만 보여준다. 웹 SDK 엔 offset 이 없어 앞 쪽도 같이 받지만,
    // 대부분 1쪽만 보므로 예전(늘 100개)보다 읽기가 적고, 100개 넘은 옛 글도 끝 쪽에서 보인다.
    const base = query(collection(db, "guestbook"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      query(base, limit(page * PER_PAGE)),
      (snap) => {
        if (page > 1 && snap.size <= (page - 1) * PER_PAGE) {
          // 쪽을 넘기면 앞 쪽 글만 든 캐시 결과가 먼저 와서 이 쪽이 빈 것처럼 보인다 → 서버 결과를 기다린다.
          // 서버 결과인데도 비었으면(지우기 등) 남은 마지막 쪽으로 옮긴다.
          if (!snap.metadata.fromCache) setPage(Math.max(1, Math.ceil(snap.size / PER_PAGE)));
          return;
        }
        setMessages(
          snap.docs.slice((page - 1) * PER_PAGE).map((d) => ({ id: d.id, ...d.data() }))
        );
        // 글이 늘거나 줄면 쪽 수도 바뀌므로 다시 센다 (집계 1번 = 읽기 1회)
        getCountFromServer(base).then((c) => setTotal(c.data().count), () => {});
      },
      () => setError("메시지를 불러오지 못했습니다.")
    );
    return () => unsub();
  }, [page]);

  function goTo(p) {
    setPage(p);
    scrollToList(listTop.current);
  }

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
      setPage(1); // 방금 남긴 글이 보이게
    } catch (e) {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  // 제보 답글과 같은 방식. 빈 칸 저장은 실수일 수 있어 막고, 지우기는 아래 deleteReply 로 확인받는다.
  async function saveReply(m) {
    const t = replyText.trim().slice(0, 500);
    if (!t) return;
    setBusyId(m.id);
    setAdminMsg("");
    try {
      await updateDoc(doc(db, "guestbook", m.id), { reply: t, replyAt: serverTimestamp() });
      setReplyFor("");
      setReplyText("");
    } catch {
      setAdminMsg("답글을 저장하지 못했어요. 보안 규칙에 관리자 UID가 들어갔는지 확인해 주세요.");
    }
    setBusyId("");
  }

  // 제보처럼 빈 답글로 덮어서 지운다. 목록은 빈 답글을 보여주지 않는다.
  async function deleteReply(m) {
    if (!window.confirm("이 글에 단 답글을 지울까요? 방문자 글은 그대로 남아요.")) return;
    setBusyId(m.id);
    setAdminMsg("");
    try {
      await updateDoc(doc(db, "guestbook", m.id), { reply: "", replyAt: serverTimestamp() });
      setReplyFor("");
      setReplyText("");
    } catch {
      setAdminMsg("답글을 지우지 못했어요. 보안 규칙을 콘솔에 다시 게시했는지 확인해 주세요.");
    }
    setBusyId("");
  }

  async function remove(m) {
    if (!window.confirm(`${m.name || "익명"} 님의 글을 지울까요? 되돌릴 수 없어요.`))
      return;
    setBusyId(m.id);
    setAdminMsg("");
    try {
      await deleteDoc(doc(db, "guestbook", m.id));
    } catch {
      setAdminMsg("지우지 못했어요. 보안 규칙에 관리자 UID가 들어갔는지 확인해 주세요.");
    }
    setBusyId("");
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
      {/* 방명록에 오류 제보를 남기는 분들이 있어 제보 화면으로 안내한다 */}
      <p style={{ color: C.textDim, fontSize: 13, margin: "-12px 0 22px" }}>
        버그나 오역은{" "}
        <a href="#/reports" style={{ color: C.gold, textUnderlineOffset: 3 }}>
          제보 탭
        </a>
        에 남겨주시면 따로 모아 확인합니다.
      </p>

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
      <div ref={listTop} />
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
                {isAdmin && (
                  <span style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
                    <button
                      onClick={() => {
                        const open = replyFor === m.id;
                        setReplyFor(open ? "" : m.id);
                        setReplyText(open ? "" : m.reply || "");
                      }}
                      style={textBtn}
                    >
                      {replyFor === m.id ? "답글 접기" : m.reply ? "답글 고치기" : "답글"}
                    </button>
                    <button
                      onClick={() => remove(m)}
                      disabled={busyId === m.id}
                      style={{ ...textBtn, color: "#d98a6a" }}
                    >
                      삭제
                    </button>
                  </span>
                )}
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
                {typeof m.reply === "string" && m.reply.trim() && (
                  <div
                    style={{
                      borderLeft: `2px solid ${C.goldDim}`,
                      background: "rgba(20,16,11,0.35)",
                      borderRadius: "0 8px 8px 0",
                      padding: "9px 12px",
                      margin: "12px 0 0",
                    }}
                  >
                    <div style={{ color: C.gold, fontSize: 12, marginBottom: 4 }}>
                      방랑자{m.replyAt ? ` · ${fmt(m.replyAt)}` : ""}
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
                      {m.reply}
                    </p>
                  </div>
                )}
              {isAdmin && replyFor === m.id && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="방랑자로 답글을 남겨주세요."
                    rows={3}
                    maxLength={500}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                    <span style={{ color: C.textDim, fontSize: 12 }}>{replyText.length}/500</span>
                    {m.reply && (
                      <button
                        onClick={() => deleteReply(m)}
                        disabled={busyId === m.id}
                        style={{ ...textBtn, color: "#d98a6a", marginLeft: "auto" }}
                      >
                        답글 지우기
                      </button>
                    )}
                    <button
                      onClick={() => saveReply(m)}
                      disabled={busyId === m.id || !replyText.trim()}
                      style={{
                        marginLeft: m.reply ? 0 : "auto",
                        padding: "6px 14px",
                        borderRadius: 7,
                        border: "none",
                        background: busyId === m.id || !replyText.trim() ? C.line : C.gold,
                        color: C.ink,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: busyId === m.id || !replyText.trim() ? "default" : "pointer",
                      }}
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {total !== null && (
        <Pager page={page} pageCount={Math.ceil(total / PER_PAGE)} onChange={goTo} />
      )}

      {admin.msg && (
        <p
          style={{
            color: "#d98a6a",
            fontSize: 13,
            textAlign: "center",
            margin: "14px 0 0",
          }}
        >
          {admin.msg}
        </p>
      )}
      <AdminFooter admin={admin} hint="관리자 모드 · 글마다 답글·삭제가 보여요" />
    </Section>
  );
}
