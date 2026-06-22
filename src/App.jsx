import { useState, useEffect } from "react";
import { C, sans } from "./theme.js";
import { GlobalStyle } from "./components/ui.jsx";
import Nav from "./components/Nav.jsx";
import Home from "./components/Home.jsx";
import Workspace from "./components/Workspace.jsx";
import Footer from "./components/Footer.jsx";
import content from "./content.json";

export default function App() {
  const [view, setView] = useState("home"); // home | workspace
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
      {view === "home" ? <Home setView={setView} /> : <Workspace />}
      <Footer />
    </div>
  );
}
