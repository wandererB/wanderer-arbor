import { useState, useEffect, lazy, Suspense } from "react";
import { C, sans } from "./theme.js";
import { GlobalStyle } from "./components/ui.jsx";
import Nav from "./components/Nav.jsx";
import Home from "./components/Home.jsx";
import Workspace from "./components/Workspace.jsx";
import Footer from "./components/Footer.jsx";
import content from "./content.json";

// 방명록은 Firebase를 쓰므로, 탭을 열 때만 로드(첫 화면 경량화)
const Guestbook = lazy(() => import("./components/Guestbook.jsx"));

export default function App() {
  const [view, setView] = useState("home"); // home | guestbook | workspace
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
      {view === "workspace" && <Workspace />}
      <Footer />
    </div>
  );
}
