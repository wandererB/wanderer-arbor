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
} from "firebase/auth";

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

  useEffect(() => {
    if (!firebaseReady) return;
    return onAuthStateChanged(getAuth(app), setUser);
  }, []);

  async function login() {
    setMsg("");
    try {
      await signInWithPopup(getAuth(app), new GoogleAuthProvider());
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
    isAdmin: !!user && ADMIN_UIDS.includes(user.uid),
    login,
    logout: () => signOut(getAuth(app)),
    msg,
    setMsg,
  };
}

// 화면 맨 아래 입구. 방문자에게는 작은 '관리' 글자 하나만 보인다.
export function AdminFooter({ admin, hint }) {
  const { user, isAdmin, login, logout } = admin;
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
      {!user ? (
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
