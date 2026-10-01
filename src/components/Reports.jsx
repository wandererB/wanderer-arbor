import { useState, useEffect, useMemo } from "react";
import { C, serif } from "../theme.js";
import { Section, inputStyle } from "./ui.jsx";
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
} from "firebase/firestore";
import { useAdmin, AdminFooter, textBtn } from "../admin.jsx";

// 분류. value 는 Firestore 에 그대로 저장되므로 보안 규칙의 허용 목록과 같아야 한다.
const TYPES = [
  { value: "진행 불가", label: "진행 불가 — 멈춤, 튕김" },
  { value: "글자 깨짐", label: "글자 깨짐 — 잘림, 겹침" },
  { value: "번역 수정", label: "번역 수정 — 오역, 어색한 표현" },
  { value: "기타", label: "기타" },
];

// 상태 배지 색. 방문자는 못 바꾸고, 관리자 모드(아래)나 Firebase 콘솔에서 바꾼다.
const STATUS_COLOR = {
  "접수": { fg: C.textDim, bd: C.line },
  "확인 중": { fg: "#d9b45f", bd: "#8a6f2e" },
  "수정 완료": { fg: "#7fc08a", bd: "#3f6d48" },
  "보류": { fg: "#9a8a68", bd: C.line },
};
const STATUSES = Object.keys(STATUS_COLOR);
const FIRST_STATUS = "접수";
const DEFAULT_NICK = "나그네"; // 나그네 쉼터라서

const COOLDOWN_MS = 60 * 1000; // 같은 브라우저에서 1분에 1건
const COOLDOWN_KEY = "wanderer:report:last";

// ── 첨부 파일 (구글 드라이브) ─────────────────────────────────────────
// scripts/report-upload.gs 를 Apps Script 웹앱으로 배포한 주소. 비어 있으면 파일 칸을 숨긴다.
const UPLOAD_URL = (content.reports && content.reports.uploadUrl) || "";
// 웹앱 쪽 제한과 같게 맞춘다(scripts/report-upload.gs).
const FILE_RULES = {
  image: {
    label: "사진",
    max: 5,
    maxBytes: 5 * 1024 * 1024,
    exts: ["jpg", "jpeg", "png", "webp"],
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    hint: "JPG·PNG·WEBP · 파일당 5MB · 최대 5장",
  },
  save: {
    label: "세이브",
    max: 2,
    maxBytes: 20 * 1024 * 1024,
    exts: null, // 기종마다 확장자가 달라 막지 않는다
    accept: "",
    hint: "실기·에뮬레이터 세이브, ZIP · 파일당 20MB · 최대 2개",
  },
};
const BLOCKED_EXTS = ["exe", "bat", "cmd", "com", "msi", "scr", "ps1", "vbs", "vbe", "js",
  "jse", "wsf", "jar", "apk", "sh", "dll", "lnk", "hta", "reg"];

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function fmtBytes(n) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;
}

// 고른 파일이 규칙에 맞는지. 맞으면 빈 문자열.
function checkFiles(kind, files) {
  const r = FILE_RULES[kind];
  if (files.length > r.max) return `${r.label}은 ${r.max}개까지 올릴 수 있어요.`;
  for (const f of files) {
    const ext = extOf(f.name);
    if (BLOCKED_EXTS.includes(ext)) return `실행 파일(.${ext})은 올릴 수 없어요.`;
    if (r.exts && !r.exts.includes(ext)) return `${r.label}은 JPG·PNG·WEBP만 올릴 수 있어요.`;
    if (f.size > r.maxBytes)
      return `${f.name} 이(가) ${fmtBytes(r.maxBytes)}를 넘어요. 압축하거나 첨부 링크로 보내주세요.`;
  }
  return "";
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// 파일 하나를 웹앱으로 보낸다. 본문을 문자열로 보내 CORS 사전요청(preflight)을 피한다.
async function uploadOne(reportId, kind, file) {
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    body: JSON.stringify({ reportId, kind, name: file.name, data: await toBase64(file) }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "upload_failed");
}

function fmt(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 제보 대상 목록은 content.json 의 다운로드 항목에서 그대로 뽑는다.
// 패치나 유틸을 추가하면 드롭다운도 같이 늘어나므로 따로 관리할 필요가 없다.
// 한글패치(메인·암자)와 봇짐 유틸은 드롭다운에서 묶음을 나눠 보여준다.
function targetGroups() {
  const patches = [];
  const tools = [];
  const push = (out, items) =>
    (items || []).forEach((it) => {
      // "마장기신 3 한글패치 (PS Vita)" 처럼 뒤에 말이 더 붙는 제목이 있어
      //  끝이 아니라 중간의 "한글패치" 도 지우고 공백을 정리한다.
      const t = (it.title || "")
        .replace(/\s*한글패치\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (t && !out.includes(t)) out.push(t);
    });
  push(patches, content.downloads);
  push(patches, content.hermitage && content.hermitage.downloads);
  push(tools, content.botjim && content.botjim.downloads);
  return { patches, tools, all: [...patches, ...tools] };
}

export default function Reports() {
  const cfg = content.reports || {};
  const groups = useMemo(targetGroups, []);
  const games = groups.all;

  const [items, setItems] = useState(null); // null = 로딩
  const [filter, setFilter] = useState("전체");
  const [game, setGame] = useState("");
  const [type, setType] = useState(TYPES[0].value);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [nick, setNick] = useState("");
  const [ver, setVer] = useState("");
  const [link, setLink] = useState("");
  const [images, setImages] = useState([]);
  const [saves, setSaves] = useState([]);
  const [fileKey, setFileKey] = useState(0);
  const [progress, setProgress] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const admin = useAdmin();
  const { isAdmin, msg: adminMsg, setMsg: setAdminMsg } = admin;
  const [busyId, setBusyId] = useState("");

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
      () => setError("목록을 불러오지 못했습니다.")
    );
    return () => unsub();
  }, []);

  async function changeStatus(r, status) {
    if (status === (r.status || FIRST_STATUS)) return;
    setBusyId(r.id);
    setAdminMsg("");
    try {
      // 목록은 실시간 구독이라 바뀐 값이 바로 반영된다
      await updateDoc(doc(db, "reports", r.id), { status, statusAt: serverTimestamp() });
    } catch {
      setAdminMsg("상태를 바꾸지 못했어요. 보안 규칙에 관리자 UID가 들어갔는지 확인해 주세요.");
    }
    setBusyId("");
  }

  async function removeReport(r) {
    if (!window.confirm(`"${r.title}" 제보를 지울까요? 되돌릴 수 없어요.\n(드라이브 첨부 파일은 남아 있어요)`))
      return;
    setBusyId(r.id);
    setAdminMsg("");
    try {
      await deleteDoc(doc(db, "reports", r.id));
    } catch {
      setAdminMsg("지우지 못했어요. 보안 규칙에 관리자 UID가 들어갔는지 확인해 주세요.");
    }
    setBusyId("");
  }

  async function send() {
    const t = title.trim();
    const b = body.trim();
    if (!game) return setError("게임이나 유틸을 골라주세요.");
    if (!t) return setError("제목을 적어주세요.");
    if (!ver.trim()) return setError("패치 버전을 적어주세요. (예: v1.2)");
    if (t.length > 100) return setError("제목은 100자까지 적을 수 있어요.");
    if (b.length > 1000) return setError("내용은 1000자까지 적을 수 있어요.");
    const l = link.trim();
    if (l && !/^https?:\/\/\S+$/.test(l))
      return setError("첨부 링크는 http:// 나 https:// 로 시작하는 주소만 넣을 수 있어요.");
    if (l.length > 500) return setError("첨부 링크가 너무 길어요.");

    if (UPLOAD_URL) {
      const fileMsg = checkFiles("image", images) || checkFiles("save", saves);
      if (fileMsg) return setError(fileMsg);
    }

    // 연타·스팸 완화. 브라우저 저장소라 우회는 가능하지만 실수 중복은 대부분 막힌다.
    try {
      const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) {
        const left = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
        return setError(`잠시 후 다시 보내주세요. (${left}초)`);
      }
    } catch {
      /* 저장소를 못 쓰면 쿨다운은 건너뛴다 */
    }

    setSending(true);
    setError("");
    const attachList = UPLOAD_URL
      ? [...images.map((f) => ["image", f]), ...saves.map((f) => ["save", f])]
      : [];
    let ref;
    try {
      ref = await addDoc(collection(db, "reports"), {
        game,
        type,
        title: t,
        body: b,
        nickname: (nick.trim() || DEFAULT_NICK).slice(0, 30),
        patchVersion: ver.trim().slice(0, 20),
        status: FIRST_STATUS, // 보안 규칙에서도 이 값만 허용한다
        createdAt: serverTimestamp(),
        // 링크가 있을 때만 넣는다(빈 값까지 쌓지 않게)
        ...(l ? { attachUrl: l } : {}),
        // 올릴 파일 개수를 미리 적어 둔다. 웹앱은 이 개수까지만 받는다.
        ...(attachList.length ? { attachCount: attachList.length } : {}),
      });
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch {
        /* noop */
      }
    } catch {
      setError("전송이 안 됐어요. 잠시 후 다시 시도해 주세요.");
      setSending(false);
      return;
    }

    // 제보는 이미 접수됐다. 첨부가 일부 실패해도 제보 자체는 살아 있다.
    let failed = 0;
    for (let i = 0; i < attachList.length; i++) {
      setProgress(`첨부 올리는 중 ${i + 1}/${attachList.length}…`);
      try {
        await uploadOne(ref.id, attachList[i][0], attachList[i][1]);
      } catch {
        failed++;
      }
    }
    setProgress("");
    setTitle("");
    setLink("");
    setBody(""); // 버전은 남겨둔다: 같은 버전으로 여러 건 이어서 보내는 경우가 많다
    setImages([]);
    setSaves([]);
    setFileKey((k) => k + 1); // 파일 칸 비우기
    setSending(false);
    if (failed) {
      setError(
        `제보는 접수됐어요. 다만 첨부 ${failed}개를 올리지 못했어요. 첨부 링크 칸으로 보내주시면 됩니다.`
      );
      return;
    }
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  }

  if (!firebaseReady) {
    return (
      <Section eyebrow="Report" title="오류 제보">
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
    <Section eyebrow="Report" title="오류 제보">
      <p
        style={{
          color: C.textDim,
          fontSize: 14,
          lineHeight: 1.8,
          margin: "0 0 22px",
        }}
      >
        {cfg.intro ||
          "패치하다가 이상한 부분을 발견하셨다면 알려주세요. 어느 장면에서 어떤 문제가 있었는지 적어주시면 확인 후 수정하겠습니다."}
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
        <label style={{ ...label, marginTop: 0 }}>게임·유틸</label>
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          style={inputStyle}
        >
          <option value="">선택</option>
          <optgroup label="한글패치">
            {groups.patches.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </optgroup>
          {groups.tools.length > 0 && (
            <optgroup label="봇짐 (유틸)">
              {groups.tools.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <label style={label}>문제 유형</label>
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
          placeholder="예: 3장 이후 대사창이 비어 있어요"
          maxLength={100}
          style={inputStyle}
        />

        <label style={label}>내용</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="어느 장면이나 메뉴에서 어떤 문제가 있었는지 적어주세요. 원문을 알면 함께 적어주셔도 좋아요."
          rows={4}
          maxLength={1000}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <label style={label}>첨부 링크 (선택)</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={
            UPLOAD_URL
              ? "파일이 크면 공유 링크로 (구글 드라이브 등)"
              : "스크린샷·세이브 파일 공유 링크 (구글 드라이브 등)"
          }
          maxLength={500}
          inputMode="url"
          style={inputStyle}
        />

        {UPLOAD_URL &&
          ["image", "save"].map((kind) => {
            const r = FILE_RULES[kind];
            const files = kind === "image" ? images : saves;
            const setFiles = kind === "image" ? setImages : setSaves;
            return (
              <div key={kind}>
                <label style={label}>{r.label} (선택)</label>
                <input
                  key={`${kind}-${fileKey}`}
                  type="file"
                  multiple
                  accept={r.accept || undefined}
                  onChange={(e) => {
                    const picked = [...(e.target.files || [])];
                    const msg = checkFiles(kind, picked);
                    if (msg) {
                      setError(msg);
                      e.target.value = "";
                      setFiles([]);
                      return;
                    }
                    setError("");
                    setFiles(picked);
                  }}
                  style={{ ...inputStyle, padding: "8px 10px", cursor: "pointer" }}
                />
                <div style={{ color: C.textDim, fontSize: 12, marginTop: 5 }}>
                  {files.length
                    ? files.map((f) => `${f.name} (${fmtBytes(f.size)})`).join(" · ")
                    : r.hint}
                </div>
              </div>
            );
          })}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label style={label}>버전 (필수)</label>
            <input
              value={ver}
              onChange={(e) => setVer(e.target.value)}
              placeholder="예: v1.2"
              maxLength={20}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label style={label}>제보자 (선택)</label>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="나그네"
              maxLength={30}
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
            disabled={sending || !game || !title.trim() || !ver.trim()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              cursor: sending || !game || !title.trim() || !ver.trim() ? "default" : "pointer",
              background: sending || !game || !title.trim() || !ver.trim() ? C.line : C.gold,
              color: C.ink,
              fontWeight: 600,
              border: "none",
              fontSize: 14,
            }}
          >
            {sending ? progress || "보내는 중…" : "보내기"}
          </button>
        </div>
        {done && (
          <p style={{ color: "#7fc08a", fontSize: 13, marginTop: 10 }}>
            접수됐어요. 확인 후 목록에 상태를 표시할게요.
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

      {adminMsg && (
        <p style={{ color: "#d98a6a", fontSize: 13, margin: "0 0 12px" }}>{adminMsg}</p>
      )}

      {/* 제보 목록 */}
      {items === null ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          불러오는 중…
        </p>
      ) : shown.length === 0 ? (
        <p style={{ color: C.textDim, textAlign: "center", padding: 30 }}>
          {items.length === 0
            ? "아직 제보가 없어요."
            : "여기엔 아직 제보가 없어요."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {shown.map((r) => {
            const sc = STATUS_COLOR[r.status] || STATUS_COLOR[FIRST_STATUS];
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
                  {isAdmin ? (
                    <select
                      value={r.status || FIRST_STATUS}
                      disabled={busyId === r.id}
                      onChange={(e) => changeStatus(r, e.target.value)}
                      aria-label="상태 바꾸기"
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 20,
                        color: sc.fg,
                        border: `1px solid ${sc.bd}`,
                        background: C.ink,
                        cursor: "pointer",
                      }}
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge fg={sc.fg} bd={sc.bd}>
                      {r.status || FIRST_STATUS}
                    </Badge>
                  )}
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
                {/* 올린 파일은 비공개(방랑자 드라이브)라 개수만 보여준다 */}
                {Number(r.attachCount) > 0 && (
                  <div style={{ color: C.goldDim, fontSize: 12, marginBottom: 6 }}>
                    📎 첨부 {Number(r.attachCount)}개
                  </div>
                )}
                {/* http(s) 링크만 링크로 띄운다(규칙에서도 막지만 한 번 더) */}
                {typeof r.attachUrl === "string" &&
                  /^https?:\/\//.test(r.attachUrl) && (
                    <a
                      href={r.attachUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{
                        display: "inline-block",
                        color: C.gold,
                        fontSize: 13,
                        marginBottom: 8,
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      첨부 보기 ↗
                    </a>
                  )}
                <div style={{ color: C.sepiaDim, fontSize: 12 }}>
                  {r.nickname || DEFAULT_NICK}
                  {r.patchVersion ? ` · ${r.patchVersion}` : ""}
                </div>
                {isAdmin && (
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: `1px dashed ${C.line}`,
                      fontSize: 12,
                    }}
                  >
                    {/* 첨부 폴더 이름에 제보 ID 가 들어 있어 검색으로 바로 찾힌다 */}
                    {Number(r.attachCount) > 0 && (
                      <a
                        href={`https://drive.google.com/drive/search?q=${encodeURIComponent(r.id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: C.gold }}
                      >
                        드라이브 첨부 ↗
                      </a>
                    )}
                    <span style={{ color: C.sepiaDim }}>ID {r.id}</span>
                    <button
                      onClick={() => removeReport(r)}
                      disabled={busyId === r.id}
                      style={{ ...textBtn, color: "#d98a6a", marginLeft: "auto" }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AdminFooter admin={admin} hint="관리자 모드 · 상태를 누르면 바꿀 수 있어요" />
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
