import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { useAdmin, AdminFooter } from "../admin.jsx";
import { doc, getDocFromServer, runTransaction, serverTimestamp } from "firebase/firestore";
const SOURCE = /^(guestbook|reports):([A-Za-z0-9_-]{1,200})$/;
const readPending = key => {try{return sessionStorage.getItem(key);}catch{return null;}};
const keyOf = r => JSON.stringify([r.reply || "", r.replyAt?.seconds || 0, r.replyAt?.nanoseconds || 0, r.message || r.body || ""]);
const scan = t => /sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----|Bearer\s+\S{24,}|\b01[016789][- ]?\d{3,4}[- ]?\d{4}\b/.test(t);
export default function AsuradaReply() {
  const admin = useAdmin();
  const target = new URLSearchParams(location.search).get("asuradaReply") || "";
  const match = SOURCE.exec(target);
  const [row,setRow] = useState(null), [text,setText] = useState("");
  const [approved,setApproved] = useState(null), [enabled,setEnabled] = useState(false);
  const [notice,setNotice] = useState("원문을 확인합니다."), [busy,setBusy] = useState(false);
  const pendingKey = "asurada.reply.pending." + target;
  const [uncertain,setUncertain] = useState(() => !!readPending(pendingKey));
  const reference = () => doc(db,match[1],match[2]);
  async function load() {
    if (!match || !db) {setNotice("답글 대상 또는 사이트 연결 설정을 확인해 주세요.");return;}
    try {
      const snap = await getDocFromServer(reference());
      if(!snap.exists()) throw Error("원글이 삭제되었습니다.");
      const value=snap.data();setRow(value);
      const pending=readPending(pendingKey);
      if(pending) {
        const sent=JSON.parse(pending);
        if(value.reply===sent.text && keyOf(value)!==sent.base) {
          sessionStorage.removeItem(pendingKey);setUncertain(false);
          setNotice("등록된 답글을 확인했습니다.");setText(value.reply||"");
        } else {
          setUncertain(true);setText(sent.text);
          setNotice("등록 여부를 아직 확인하지 못했습니다. 자동 재등록하지 않습니다. 아래에서 다시 확인해 주세요.");
        }
      } else {setText(value.reply||"");setNotice(value.reply ? "기존 답글이 있습니다. 수정 후 미리보기를 확인하세요." : "답글을 작성해 주세요.");}
      setApproved(null);
    } catch(e) {setNotice(e.message||"원문을 불러오지 못했습니다.");}
  }
  useEffect(()=>{load();},[]);
  const edit = value => {setText(value);setApproved(null);};
  async function publish() {
    if(busy||uncertain||!admin.isAdmin||!enabled||!row||approved!==text) return;
    const exact=text.trim();
    if(!exact||exact.length>500||scan(exact)) {setNotice("500자 이내로 작성하고 비밀정보·개인 연락처를 제거해 주세요.");return;}
    const base=keyOf(row);
    // Persist before sending. If the response is lost, opening this editor only reads.
    try {sessionStorage.setItem(pendingKey,JSON.stringify({text:exact,base}));}
    catch {setNotice("등록 상태를 보관할 수 없어 전송하지 않았습니다.");return;}
    setBusy(true);setUncertain(true);setApproved(null);
    try {
      await runTransaction(db,async tx=>{
        const snap=await tx.get(reference());
        if(!snap.exists()) throw Error("원글이 삭제되었습니다.");
        const current=snap.data();
        if(current.reply===exact) return;
        if(keyOf(current)!==base) throw Error("다른 곳에서 원문 또는 답글이 변경됐습니다. 다시 확인해 주세요.");
        tx.update(reference(),{reply:exact,replyAt:serverTimestamp()});
      },{maxAttempts:1});
      sessionStorage.removeItem(pendingKey);setUncertain(false);
      await load();setNotice("답글을 등록했습니다.");
    } catch(e) {
      // Definitive rejection can be edited. Unknown transport outcomes remain read-only.
      if(["permission-denied","unauthenticated","invalid-argument"].includes(e.code) || /변경|삭제/.test(e.message||"")) {
        sessionStorage.removeItem(pendingKey);setUncertain(false);
        setNotice("등록하지 못했습니다. 관리자 로그인·규칙 또는 원문 변경을 확인하세요.");
      } else setNotice("등록 여부 확인 중입니다. 다시 보내지 않고 결과를 확인해 주세요.");
    } finally {setBusy(false);}
  }
  return <main className="asurada-reply" style={{maxWidth:680,margin:"auto",padding:18,color:"#e9edf5",background:"#101b2b",minHeight:"100vh",fontFamily:"sans-serif"}}>
    <style>{".asurada-reply button{min-height:44px;padding:8px 14px;border:1px solid #41617a;border-radius:10px;background:#203c56;color:#e9edf5;margin:4px 4px 4px 0;font-size:15px}.asurada-reply button:disabled{opacity:.5}.asurada-reply textarea{background:#172a40;color:#e9edf5;border:1px solid #41617a;border-radius:10px;padding:12px}.asurada-reply input{min-width:20px;min-height:20px;vertical-align:middle}"}</style>
    <h2>{match?.[1]==="guestbook"?"방명록":"제보"} 답글</h2>
    <p style={{whiteSpace:"pre-wrap"}}>{row ? (row.title ? row.title+"\n" : "")+(row.message||row.body||"") : ""}</p>
    {row?.reply && <blockquote style={{whiteSpace:"pre-wrap"}}>현재 답글: {row.reply}</blockquote>}
    <p role="status">{notice}</p>
    <AdminFooter admin={admin} hint="기존 홈페이지 관리자 Google 계정으로 로그인해 주세요." />
    <label style={{display:"block",margin:"16px 0"}}><input type="checkbox" checked={enabled} onChange={e=>{setEnabled(e.target.checked);setApproved(null);}}/> 이 사이트 외부 답글 등록 허용</label>
    <textarea aria-label="답글 내용" value={text} maxLength={500} disabled={busy||uncertain||!row} onChange={e=>edit(e.target.value)}
      style={{width:"100%",minHeight:140,boxSizing:"border-box",fontSize:16}}/>
    <p>{text.length}/500</p>
    <button disabled={busy||uncertain||!row} onClick={()=>edit(match[1]==="reports" ? "제보 감사합니다. 알려주신 내용을 확인한 뒤 진행 상황을 이곳에 안내드리겠습니다." : "방문해 주셔서 감사합니다. 남겨주신 말씀 잘 읽었습니다.")}>기본 초안</button>{" "}
    <button disabled={busy||uncertain||!row||!text.trim()} onClick={()=>{
      if(scan(text)){setNotice("비밀정보·개인 연락처 의심 내용이 있습니다. 수정해 주세요.");return;}
      setApproved(text);
    }}>미리보기</button>{" "}
    {!uncertain && <button disabled={busy} onClick={()=>{if(window.confirm("원문과 등록된 답글을 다시 불러올까요? 작성 중인 내용은 바뀝니다."))load();}}>원문 다시 확인</button>}
    {uncertain && <button disabled={busy} onClick={load}>등록 결과 확인</button>}
    {approved!==null && <section><h3>사이트에 공개될 답글</h3><p style={{whiteSpace:"pre-wrap"}}>{approved}</p>
      <button disabled={busy||uncertain||!admin.isAdmin||!enabled||approved!==text} onClick={publish}>이 내용으로 승인·등록</button>
    </section>}
  </main>;
}