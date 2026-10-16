// 관리자 모드 — 방명록·제보에서 같이 쓴다.
//
// content.json 의 reports.adminUids 에 있는 구글 계정으로 로그인했을 때만
// 지우기·상태 바꾸기 버튼이 보인다. 실제로 막는 건 firestore.rules 의 isAdmin() 이고,
// 여기 목록은 버튼을 보여줄지만 정한다(두 곳에 같은 UID 를 넣어야 한다).
import { useState, useEffect } from "react";
import { C } from "./theme.js";
import content from "./content.json";
import { app, firebaseReady } from "./firebase.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";

let persistenceReady;
function restorePersistence() {
  if (!persistenceReady) {
    const auth = getAuth(app);
    // Prefer localStorage: some embedded Safari contexts expose IndexedDB
    // without retaining its data across iframe lifetimes.
    persistenceReady = setPersistence(auth, browserLocalPersistence)
      .catch(() => setPersistence(auth, indexedDBLocalPersistence))
      .then(() => true, () => false);
  }
  return persistenceReady;
}

const ADMIN_UIDS = (content.reports && content.reports.adminUids) || [];

export const textBtn = {
  background: "none",
  border: "none",
  padding: 0,
  color: C.sepiaDim,
  fontSize: 12,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export function useAdmin() {
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady) { setReady(true); setMsg("사이트 로그인 설정을 확인해 주세요."); return; }
    let cancelled = false;
    let unsubscribe;
    restorePersistence().then(persistent => {
      if (cancelled) return;
      if (!persistent) setMsg("이 창에서 로그인 저장이 제한되어 있습니다. 창을 다시 열면 로그인이 필요할 수 있습니다.");
      unsubscribe = onAuthStateChanged(getAuth(app), value => {
        setUser(value);
        setReady(true);
      }, () => {
        setReady(true);
        setMsg("로그인 상태를 복원하지 못했습니다. 다시 로그인해 주세요.");
      });
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);

  async function login() {
    setMsg("");
    try {
      const persistent = await restorePersistence();
      await signInWithPopup(getAuth(app), new GoogleAuthProvider());
      if (!persistent) setMsg("현재 창에서만 로그인되었습니다. 브라우저가 로그인 저장을 제한하고 있습니다.");
    } catch (e) {
      const code = (e && e.code) || "unknown";
      // 창을 직접 닫은 건 실수가 아니라 취소라 조용히 넘어간다
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request")
        return;
      setMsg(`로그인하지 못했어요. (${code})`);
    }
  }

  return {
    user,
    ready,
    isAdmin: !!user && ADMIN_UIDS.includes(user.uid),
    login,
    logout: () => signOut(getAuth(app)),
    msg,
    setMsg,
  };
}

// 화면 맨 아래 입구. 방문자에게는 작은 '관리' 글자 하나만 보인다.
export function AdminFooter({ admin, hint }) {
  const { user, isAdmin, login, logout, ready, msg } = admin;
  return (
    <div
      style={{
        marginTop: 30,
        textAlign: "center",
        color: C.sepiaDim,
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      {msg && <p role="status">{msg}</p>}
      {!ready ? <span role="status">로그인 확인 중…</span> : !user ? (
        <button onClick={login} style={textBtn}>
          관리
        </button>
      ) : (
        <>
          {isAdmin ? (
            hint
          ) : (
            <>
              관리자로 등록된 계정이 아니에요.
              <br />
              <span style={{ userSelect: "all" }}>UID {user.uid}</span>
            </>
          )}
          {" · "}
          <button onClick={logout} style={textBtn}>
            로그아웃
          </button>
        </>
      )}
    </div>
  );
}
