import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" → 모든 에셋을 상대경로로 출력합니다.
// 덕분에 빌드 결과가 어느 경로에 올라가도 동작합니다:
//   - GitHub Pages 프로젝트 사이트 ( https://<user>.github.io/<repo>/ )
//   - 사용자/조직 사이트, Vercel, 로컬 preview
// 이 앱은 클라이언트 라우터가 없어(상태 기반 화면 전환) 상대 base가 완전히 안전합니다.

// Firebase 는 방명록·제보를 열 때만 받는다. 우리 코드와 한 파일로 묶여 있으면
// content.json 을 한 글자만 고쳐도 파일 이름(해시)이 바뀌어 방문자가 매번 다시 받으므로,
// 따로 떼어 Firebase 버전을 올릴 때만 바뀌게 한다. 하나로 묶으면 500kB 경고가 나서 셋으로 나눈다.
// 진입 파일(firebase/firestore 등)은 본체(@firebase/firestore)와 같은 묶음에 둬야 한다.
// core 쪽에 두면 core ↔ firestore 가 서로 불러오는 순환이 생겨 방명록이 "before initialization" 으로 죽는다.
function firebaseChunk(id) {
  if (!id.includes("node_modules")) return;
  if (/[\\/]@?firebase[\\/]firestore[\\/]/.test(id)) return "firebase-firestore";
  if (/[\\/]@?firebase[\\/]auth[\\/]/.test(id)) return "firebase-auth";
  if (/[\\/](@firebase|firebase|idb)[\\/]/.test(id)) return "firebase-core";
}

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: { manualChunks: firebaseChunk },
    },
  },
});
