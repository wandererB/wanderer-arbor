import { useState, useEffect, useMemo } from "react";
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

// 분류. value 는 Firestore 에 그대로 저장되므로 보안 규칙의 허용 목록과 같아야 한다.
const TYPES = [
  { value: "버그", label: "버그 — 진행 불가·표시 깨짐 등" },
  { value: "오역", label: "오역 — 뜻이 틀린 번역" },
  { value: "번역 개선", label: "번역 개선 — 어색한 문장 다듬기" },
  { value: "기타", label: "기타" },
];

// 상태 배지 색. 상태는 Firebase 콘솔에서 직접 바꾼다(클라이언트는 못 바꾼다).
const STATUS_COLOR = {
  "접수됨": { fg: C.textDim, bd: C.line },
  "확인중": { fg: "#d9b45f", bd: "#8a6f2e" },
  "반영됨": { fg: "#7fc08a", bd: "#3f6d48" },
  "보류": { fg: "#9a8a68", bd: C.line },
};

const COOLDOWN_MS = 60 * 1000; // 같은 브라우저에서 1분에 1건
const COOLDOWN_KEY = "wanderer:report:last";

function fmt(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 제보 대상 게임 목록은 content.json 의 다운로드 항목에서 그대로 뽑는다.
// 패치를 추가하면 드롭다운도 같이 늘어나므로 따로 관리할 필요가 없다.
function gameList() {
  const out = [];
  const push = (items) =>
    (items || []).forEach((it) => {
      // "마장기신 3 한글패치 (PS Vita)" 처럼 뒤에 말이 더 붙는 제목이 있어
      //  끝이 아니라 중간의 "한글패치" 도 지우고 공백을 정리한다.
      const t = (it.title || "")
        .replace(/\s*한글패치\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (t && !out.includes(t)) out.push(t);
    });
  push(content.downloads);
  push(content.hermitage && content.hermitage.downloads);
  push(content.botjim && content.botjim.downloads);
  return out;
}

export default function Reports() {
  const cfg = content.reports || {};
  const games = useMemo(gameList, []);

  const [items, setItems] = useState(null); // null = 로딩
  const [filter, setFilter] = useState("전체");
  const [game, setGame] = useState("");
  const [type, setType] = useState(TYPES[0].value);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [nick, setNick] = useState("");
  const [ver, setVer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!firebaseReady) {
      setItems([]);
      return;
    }
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setError("제보 목록을 불러오지 못했습니다.")
    );
    return () => unsub();
  }, []);

  async function send() {
    const t = title.trim();
    const b = body.trim();
    if (!game) return setError("게임을 선택해 주세요.");
    if (!t) return setError("제목을 적어주세요.");
    if (t.length > 100) return setError("제목은 100자 이내로 적어주세요.");
    if (b.length > 1000) return setError("내용은 1000자 이내로 적어주세요.");

    // 연타·스팸 완화. 브라우저 저장소라 우회는 가능하지만 실수 중복은 대부분 막힌다.
    try {
      const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) {
        const left = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
        return setError(`연속 제보는 잠시 후에 가능합니다. (${left}초 남음)`);
      }
    } catch {
      /* 저장소를 못 쓰면 쿨다운은 건너뛴다 */
    }

    setSending(true);
    setError("");
    try {
      await addDoc(collection(db, "reports"), {
        game,
        type,
        title: t,
        body: b,
        nickname: (nick.trim() || "익명").slice(0, 30),
        patchVersion: ver.trim().slice(0, 20),
        status: "접수됨", // 보안 규칙에서도 이 값만 허용한다
        createdAt: serverTimestamp(),
      });
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
      setTitle("");
      setBody("");
      setVer("");
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  if (!firebaseReady) {
    return (
      <Section eyebrow="Feedback" title="오류 제보">
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
          제보 게시판 준비 중입니다.
          <br />
          (Firebase 연결 후 열립니다.)
        </div>
      </Section>
    );
  }

  const shown =
    items && filter !== "전체" ? items.filter((r) => r.game === filter) : items;
  const label = {
    display: "block",
    color: C.sepia,
    fontSize: 13,
    margin: "12px 0 5px",
  };

  return (
    <Section eyebrow="Feedback" title="오류 제보">
      <p
        style={{
          color: C.textDim,
          fontSize: 14,
          lineHeight: 1.8,
          margin: "0 0 22px",
        }}
      >
        {cfg.intro ||
          "버그·오역·번역 개선 제안을 받습니다. 어디서(장면·메뉴), 무엇이(원문/현재 번역), 어떻게 되면 좋을지 적어주시면 반영이 빨라집니다."}
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
        <label style={{ ...label, marginTop: 0 }}>게임</label>
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          style={inputStyle}
        >
          <option value="">선택해 주세요</option>
          {games.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <label style={label}>분류</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label style={label}>제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2장 보스전 직후 대사가 잘립니다"
          maxLength={100}
          style={inputStyle}
        />

        <label style={label}>내용</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="어디서(장면·메뉴), 무엇이(원문/현재 번역), 어떻게 되면 좋을지 적어주세요."
          rows={4}
          maxLength={1000}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={label}>닉네임 (선택)</label>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="익명"
              maxLength={30}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={label}>패치 버전 (선택)</label>
            <input
              value={ver}
              onChange={(e) => setVer(e.target.value)}
              placeholder="예: v1.0"
              maxLength={20}
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 14,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: C.textDim, fontSize: 12 }}>
            {body.length}/1000
          </span>
          <button
            onClick={send}
            disabled={sending || !game || !title.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              cursor: sending || !game || !title.trim() ? "default" : "pointer",
              background: sending || !game || !title.trim() ? C.line : C.gold,
              color: C.ink,
              fontWeight: 600,
              border: "none",
              fontSize: 14,
            }}
          >
            {sending ? "보내는 중…" : "제보 보내기"}
          </button>
        </div>
        {done && (
          <p style={{ color: "#7fc08a", fontSize: 13, marginTop: 10 }}>
            접수됐습니다. 확인 후 이 목록의 상태가 바뀝니다.
          </p>
        )}
        {error && (
          <p style={{ color: "#d98a6a", fontSize: 13, marginTop: 10 }}>{error}</p>
        )}
      </div>

      {/* 게임별 필터 */}
      {items && items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 200 }}
          >
            <option value="전체">전체 ({items.length}건)</option>
            {games
              .filter((g) => items.some((r) => r.game === g))
              .map((g) => (
                <option key={g} value={g}>
                  {g} ({items.filter((r) => r.game === g).length}건)
                </option>
              ))}
          </select>
        </div>
      )}

      {/* 제보 목록 */}
      {items === null ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          불러오는 중…
        </p>
      ) : shown.length === 0 ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          {items.length === 0
            ? "아직 접수된 제보가 없습니다."
            : "이 게임의 제보가 없습니다."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {shown.map((r) => {
            const sc = STATUS_COLOR[r.status] || STATUS_COLOR["접수됨"];
            return (
              <div
                key={r.id}
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
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <Badge fg={C.gold} bd={C.goldDim}>
                    {r.type || "기타"}
                  </Badge>
                  <Badge fg={sc.fg} bd={sc.bd}>
                    {r.status || "접수됨"}
                  </Badge>
                  <span style={{ color: C.textDim, fontSize: 12 }}>{r.game}</span>
                  <span
                    style={{ color: C.textDim, fontSize: 12, marginLeft: "auto" }}
                  >
                    {fmt(r.createdAt)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: serif,
                    color: C.text,
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {r.title}
                </div>
                {r.body && (
                  <p
                    style={{
                      color: C.textDim,
                      fontSize: 14,
                      lineHeight: 1.7,
                      margin: "0 0 8px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {r.body}
                  </p>
                )}
                <div style={{ color: C.sepiaDim, fontSize: 12 }}>
                  {r.nickname || "익명"}
                  {r.patchVersion ? ` · ${r.patchVersion}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function Badge({ children, fg, bd }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 9px",
        borderRadius: 20,
        color: fg,
        border: `1px solid ${bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
