// 작업공간 데이터의 로컬 영속화 (IndexedDB via idb-keyval).
// 데이터는 이 브라우저 안에만 저장되며 서버로 전송되지 않습니다.
import { get, set, del } from "idb-keyval";

const NOTES_KEY = "wanderer:notes";

export async function loadNotes() {
  try {
    const stored = await get(NOTES_KEY);
    return stored ?? null; // null = 저장된 값 없음(시드 사용)
  } catch {
    return null;
  }
}

export async function saveNotes(items) {
  try {
    await set(NOTES_KEY, items);
  } catch {
    /* 저장 실패는 조용히 무시 (사생활/시크릿 모드 등) */
  }
}

export async function clearNotes() {
  try {
    await del(NOTES_KEY);
  } catch {
    /* noop */
  }
}
