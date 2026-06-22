import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" → 모든 에셋을 상대경로로 출력합니다.
// 덕분에 빌드 결과가 어느 경로에 올라가도 동작합니다:
//   - GitHub Pages 프로젝트 사이트 ( https://<user>.github.io/<repo>/ )
//   - 사용자/조직 사이트, Vercel, 로컬 preview
// 이 앱은 클라이언트 라우터가 없어(상태 기반 화면 전환) 상대 base가 완전히 안전합니다.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
