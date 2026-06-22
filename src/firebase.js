// Firebase 초기화 — 방명록(공유 저장소)용.
// 설정값은 content.json 의 guestbook.firebase 에서 읽습니다(웹 config는 공개돼도 안전,
// 보안은 Firestore 규칙으로 처리). 설정이 비어 있으면 초기화하지 않고 db=null 을 반환합니다.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import content from "./content.json";

const cfg = content.guestbook && content.guestbook.firebase;
export const firebaseReady = !!(cfg && cfg.apiKey && cfg.projectId);

let _db = null;
if (firebaseReady) {
  const app = initializeApp(cfg);
  _db = getFirestore(app);
}
export const db = _db;
