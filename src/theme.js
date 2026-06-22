// ---- 디자인 토큰 (프로토타입에서 확정, 변경 금지) ----
export const C = {
  ink: "#16120d",
  ink2: "#1f1a13",
  paper: "#2a241b",
  line: "#4a3f2e",
  gold: "#e8d5a0",
  goldDim: "#b89b63",
  sepia: "#c9b48c",
  sepiaDim: "#8f7d5c",
  text: "#ddceae",
  textDim: "#9a8a68",
};

export const serif = "'Noto Serif KR', 'Nanum Myeongjo', Georgia, serif";
export const sans = "'Pretendard', 'Noto Sans KR', system-ui, sans-serif";

// public/ 에셋 경로 헬퍼 — Vite base(상대경로 배포)를 존중합니다.
// asset("images/hero.jpg") → "./images/hero.jpg" (빌드) / "/images/hero.jpg" (dev)
export const asset = (p) => `${import.meta.env.BASE_URL}${p}`;
