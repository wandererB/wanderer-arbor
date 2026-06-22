// Firebase 초기화 — 방명록(공유 저장소)용.
// 설정값은 content.json 의 guestbook.firebase 에서 읽습니다(웹 config는 공개돼도 안전,
// 보안은 Firestore 규칙으로 처리). 설정이 비어 있으면 초기화하지 않고 db=null 을 반환합니다.
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import content from "./content.json";

const cfg = content.guestbook && content.guestbook.firebase;
export const firebaseReady = !!(cfg && cfg.apiKey && cfg.projectId);

let _db = null;
if (firebaseReady) {
  const app = initializeApp(cfg);
  // 일부 네트워크/프록시가 Firestore 실시간 채널(WebChannel)을 막는 경우를 대비해
  // long-polling 자동 감지를 켭니다(연결 안정성 향상).
  _db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}
export const db = _db;
