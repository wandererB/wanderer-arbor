/**
 * 방랑자의 그늘쉼터 — 오류 제보 첨부 받기 (Apps Script 웹앱)
 *
 * 사이트 제보 화면(#/reports)이 파일을 하나씩 보내면, 방랑자 구글 드라이브의
 * "방랑자 제보 첨부" 폴더 아래 제보별 폴더에 저장합니다. 파일은 비공개(소유자만)입니다.
 *
 * 설치 (한 번만):
 *  1) script.google.com → 새 프로젝트 → 이 파일 내용 전체를 붙여넣고 저장
 *  2) 위쪽 함수 목록에서 selfTest 선택 → 실행 → 권한 요청 [허용]
 *     (드라이브 폴더를 만들고 Firestore 접속을 시험합니다)
 *  3) [배포] → [새 배포] → 유형: 웹 앱
 *       - 실행 계정: 나
 *       - 액세스 권한: 모든 사용자
 *     → 배포 → "웹 앱 URL"(…/exec)을 복사해 사이트 content.json 의 reports.uploadUrl 에 넣습니다.
 *  코드를 고친 뒤에는 [배포 관리] → 연필 → 버전: 새 버전 으로 다시 배포해야 반영됩니다.
 *
 * 누구나 호출할 수 있는 주소라서 아래처럼 막습니다.
 *  - Firestore 에 방금(30분 안) 만들어진 제보가 있고, 그 제보가 attachCount 로 예고한 개수까지만 받습니다.
 *  - 사진은 jpg·jpeg·png·webp 5MB, 세이브는 20MB. 실행 파일 확장자는 거부합니다.
 *  - 하루 총 300MB 를 넘으면 그날은 받지 않습니다.
 *  - 파일 형식(MIME)은 보낸 쪽 말을 믿지 않고 확장자로 정합니다.
 */

var PROJECT_ID = 'wanderer-arbor';
var ROOT_FOLDER = '방랑자 제보 첨부';
var LIMITS = {
  image: { maxBytes: 5 * 1024 * 1024, exts: ['jpg', 'jpeg', 'png', 'webp'] },
  save: { maxBytes: 20 * 1024 * 1024, exts: null }, // 세이브는 기종마다 확장자가 달라 막지 않음
};
var BLOCKED_EXTS = ['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'ps1', 'vbs', 'vbe', 'js', 'jse',
                    'wsf', 'jar', 'apk', 'sh', 'dll', 'lnk', 'hta', 'reg'];
var MAX_FILES_PER_REPORT = 7;
var DAILY_BYTES = 300 * 1024 * 1024;
var REPORT_FRESH_MS = 30 * 60 * 1000;
var IMAGE_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function doGet() {
  return out_({ ok: true, service: 'wanderer-report-upload' });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var reportId = String(req.reportId || '');
    if (!/^[A-Za-z0-9]{10,40}$/.test(reportId)) return fail_('bad_report');
    var kind = req.kind === 'image' ? 'image' : req.kind === 'save' ? 'save' : '';
    if (!kind) return fail_('bad_kind');

    var name = String(req.name || 'file')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 120) || 'file';
    var ext = name.indexOf('.') >= 0 ? name.split('.').pop().toLowerCase() : '';
    if (BLOCKED_EXTS.indexOf(ext) >= 0) return fail_('blocked_type');
    if (LIMITS[kind].exts && LIMITS[kind].exts.indexOf(ext) < 0) return fail_('bad_type');

    var bytes = Utilities.base64Decode(String(req.data || ''));
    if (!bytes.length) return fail_('empty');
    if (bytes.length > LIMITS[kind].maxBytes) return fail_('too_large');

    var report = fetchReport_(reportId);
    if (!report) return fail_('no_report');
    if (Date.now() - Date.parse(report.createTime) > REPORT_FRESH_MS) return fail_('too_late');
    var expected = Number(((report.fields || {}).attachCount || {}).integerValue || 0);
    if (expected <= 0) return fail_('no_attach_expected');

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var props = PropertiesService.getScriptProperties();
      var dayKey = 'bytes_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
      var used = Number(props.getProperty(dayKey) || 0);
      if (used + bytes.length > DAILY_BYTES) return fail_('daily_limit');

      var folder = reportFolder_(reportId, report);
      var count = 0;
      var it = folder.getFiles();
      while (it.hasNext()) { it.next(); count++; }
      if (count >= Math.min(expected, MAX_FILES_PER_REPORT)) return fail_('too_many');

      var mime = kind === 'image' ? IMAGE_MIME[ext] : 'application/octet-stream';
      var file = folder.createFile(Utilities.newBlob(bytes, mime, name));
      props.setProperty(dayKey, String(used + bytes.length));
      return out_({ ok: true, name: file.getName(), size: bytes.length });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return fail_('server');
  }
}

function fetchReport_(reportId) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
            '/databases/(default)/documents/reports/' + encodeURIComponent(reportId);
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  return JSON.parse(res.getContentText());
}

function rootFolder_() {
  var found = DriveApp.getFoldersByName(ROOT_FOLDER);
  return found.hasNext() ? found.next() : DriveApp.createFolder(ROOT_FOLDER);
}

function reportFolder_(reportId, report) {
  var root = rootFolder_();
  var it = root.getFolders();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getName().indexOf(reportId) >= 0) return f;
  }
  var fields = report.fields || {};
  var game = String(((fields.game || {}).stringValue) || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  var day = Utilities.formatDate(new Date(Date.parse(report.createTime)), 'Asia/Seoul', 'yyyy-MM-dd');
  return root.createFolder(day + ' ' + game + ' ' + reportId);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(code) {
  return out_({ ok: false, error: code });
}

/** 설치 2단계용: 권한을 받고 폴더·Firestore 접속을 확인합니다. */
function selfTest() {
  var root = rootFolder_();
  var res = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
    '/databases/(default)/documents/reports?pageSize=1', { muteHttpExceptions: true });
  console.log('드라이브 폴더: ' + root.getName() + ' (' + root.getUrl() + ')');
  console.log('Firestore 응답: HTTP ' + res.getResponseCode());
}
