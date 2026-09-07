import { useState, useEffect, lazy, Suspense } from "react";
import { C, sans } from "./theme.js";
import { GlobalStyle } from "./components/ui.jsx";
import Nav from "./components/Nav.jsx";
import Home from "./components/Home.jsx";
import Botjim from "./components/Botjim.jsx";
import Hermitage from "./components/Hermitage.jsx";
import Genki from "./components/Genki.jsx";
import Footer from "./components/Footer.jsx";
import content from "./content.json";

// 방명록은 Firebase를 쓰므로, 탭을 열 때만 로드(첫 화면 경량화)
const Guestbook = lazy(() => import("./components/Guestbook.jsx"));

const VIEWS = ["home", "guestbook", "botjim", "hermitage", "genki"];

// 주소의 해시를 화면 이름으로. "#/guestbook" → "guestbook", 모르는 값이면 home.
// GitHub Pages 는 서버 라우팅이 없어서 해시 방식을 쓴다(경로 방식은 새로고침 시 404).
function viewFromHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  return VIEWS.includes(h) ? h : "home";
}

export default function App() {
  const [view, setViewState] = useState(viewFromHash);

  // 주소가 바뀌면 화면을 따라간다 — 뒤로가기, 링크 붙여넣기, 새로고침.
  useEffect(() => {
    const sync = () => setViewState(viewFromHash());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  // 화면을 바꾸면 주소도 바꾼다. 홈만 해시를 지워 기본 주소를 깨끗하게 둔다.
  // (pushState 는 hashchange 를 안 띄우므로 state 를 직접 맞춰준다)
  const setView = (next) => {
    if (next === "home") {
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    } else {
      window.location.hash = `#/${next}`;
    }
    setViewState(next);
  };

  useEffect(() => {
    document.title = content.site.name;
  }, []);
  return (
    <div
      style={{
        background: C.ink,
        minHeight: "100vh",
        color: C.text,
        fontFamily: sans,
      }}
    >
      <GlobalStyle />
      <Nav view={view} setView={setView} />
      {view === "home" && <Home setView={setView} />}
      {view === "guestbook" && (
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: 60, color: C.textDim }}>
              불러오는 중…
            </div>
          }
        >
          <Guestbook />
        </Suspense>
      )}
      {view === "botjim" && <Botjim setView={setView} />}
      {view === "hermitage" && <Hermitage setView={setView} />}
      {view === "genki" && <Genki setView={setView} />}
      <Footer />
    </div>
  );
}
