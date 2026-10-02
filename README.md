# 방랑자 한글패치 사이트

PSP **마장기신 THE LORD OF ELEMENTAL** 비공식 한글패치의 배포 + 개인 작업공간 사이트.
정적 사이트(무료 호스팅) · 작업공간 데이터는 브라우저 로컬(IndexedDB)에만 저장.

Vite + React 로 구성되어 있습니다.

---

## 빠른 시작

```bash
npm install      # 최초 1회 (의존성 설치)
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 정적 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

> Node.js LTS(18+) 필요. 이 저장소는 Node 24 / npm 11 에서 빌드 확인됨.

---

## 폴더 구조

```
wanderer/
├─ public/
│  ├─ images/        # hero.jpg · banner.jpg · logo.png (웹용 변환본)
│  └─ favicon.png
├─ src/
│  ├─ content.json   # ★ 공개 콘텐츠 (소개·통계·다운로드·변경이력) — 여기만 고치면 됨
│  ├─ workspaceData.js # 작업공간 시드(메모/연구) 기본값
│  ├─ db.js          # IndexedDB 영속화 (idb-keyval)
│  ├─ theme.js       # 디자인 토큰 + 에셋 경로 헬퍼
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ components/    # Nav, Hero, PatchSection, DownloadSection, ChangelogSection,
│                    # Workspace, Dashboard, Notes, Research, Footer, ui(공통)
├─ scripts/
│  └─ split-release.ps1  # 2GiB 넘는 파일을 릴리스용 파트로 분할
├─ .github/workflows/deploy.yml  # GitHub Pages 자동 배포
└─ _source/          # 원본 디자인 PNG·프로토타입 (gitignore, 저장소 미포함)
```

---

## 콘텐츠 수정 (코드 안 건드리고 갱신)

`src/content.json` 한 파일만 고치면 사이트 내용이 바뀝니다.

- `patch.intro` / `patch.stats` — 패치 소개 문구·통계 카드
- `download.version` · `download.date` · `download.size` — 다운로드 카드 표시
- `download.url` — **GitHub Releases 주소를 넣으면** 다운로드 버튼이 실제 링크로 바뀝니다. (비워두면 안내 알림)
- `changelog[]` — 버전별 변경 이력 (맨 위 항목이 최신으로 강조됨)

### 2GB 넘는 파일 배포 (분할 업로드)

GitHub Releases 는 **에셋 1개당 2GiB** 가 플랫폼 하드 리밋입니다. 저장소 설정으로 못 늘리고,
웹 UI 든 API 든 그보다 큰 파일은 업로드가 거부됩니다. 그래서 큰 패치는 파트로 나눠 올립니다.

```powershell
# 원본을 1900MB 씩 잘라 <파일이름>_parts 폴더에 .001 / .002 … 생성
.\scripts\split-release.ps1 -Path "D:\patch\PS3.The.Fighting.KR_v2.0.zip" -Tag "ippo-v2.0"
```

스크립트가 만들어 주는 것:

| 파일 | 용도 |
| --- | --- |
| `<이름>.001`, `.002` … | 릴리스에 올릴 파트 (재압축 없는 raw 분할) |
| `join.bat` | 7-Zip 없이 `copy /b` 로 합치는 배치 파일 |
| `SHA256.txt` | 합친 뒤 원본과 같은지 확인용 해시 |
| `content-parts.json` | 아래 `parts` 에 그대로 붙여넣을 JSON |

그 다음 릴리스에 파트를 전부 올리고, `src/content.json` 의 해당 항목을 `url` → `parts` 로 바꿉니다.

```json
{
  "title": "시작의 일보[PS3] 한글패치",
  "version": "2.0",
  "size": "약 2.6GB (분할 2개)",
  "parts": [
    { "label": "파트 1/2", "url": "https://github.com/.../PS3.The.Fighting.KR_v2.0.zip.001", "size": "약 1900MB" },
    { "label": "파트 2/2", "url": "https://github.com/.../PS3.The.Fighting.KR_v2.0.zip.002", "size": "약 760MB" }
  ]
}
```

- `parts` 가 있으면 다운로드 카드의 `↓ 다운로드` 버튼이 번호 칩(`1` `2` …)으로 바뀌고,
  합치는 방법 안내문이 자동으로 붙습니다. (`url` 키는 지웁니다)
- 칩에 마우스를 올리면 `label · size` 가 툴팁으로 뜹니다. `label` 을 안 적으면 `파트 N` 이 기본값입니다.
- 안내문을 바꾸고 싶으면 같은 항목에 `partsNote` 를 넣으면 됩니다.
- 받는 쪽은 파트를 한 폴더에 모아 **.001 을 7-Zip 으로 열거나**, `join.bat` 실행, 또는
  `copy /b "이름.zip.001"+"이름.zip.002" "이름.zip"` 중 아무거나 하면 됩니다.

### 아직 채워야 할 placeholder (더미 데이터)
- [ ] `patch.intro`, `patch.stats` 수치 검증 (현재 29,000행 등은 예시)
- [ ] `changelog` 실제 버전 이력으로 교체 (현재 v0.4.0 등은 예시)
- [ ] `download.url` 실제 Releases 링크 연결

---

## 화면별 주소 (해시 라우팅)

화면을 바꾸면 주소도 같이 바뀌므로 특정 화면을 바로 링크할 수 있습니다.

| 화면 | 주소 |
| --- | --- |
| 패치(홈) | `.../wanderer-arbor/` |
| 암자 | `.../wanderer-arbor/#/hermitage` |
| 봇짐 | `.../wanderer-arbor/#/botjim` |
| 방명록 | `.../wanderer-arbor/#/guestbook` |
| 제보 | `.../wanderer-arbor/#/reports` |
| 원기옥 | `.../wanderer-arbor/#/genki` |

- 새로고침해도 그 화면이 유지되고, 브라우저 뒤로가기가 화면 이동을 따라갑니다.
- 모르는 해시(`#/없는페이지`)는 홈으로 떨어집니다.
- GitHub Pages 는 서버 라우팅이 없어서 해시 방식을 씁니다. 경로 방식(`/guestbook`)은
  새로고침할 때 404 가 납니다.
- 화면을 추가하면 `src/App.jsx` 의 `VIEWS` 배열에도 이름을 넣어야 주소가 동작합니다.

## 오류 제보 게시판

`#/reports` 화면에서 방문자가 버그·오역·번역 개선을 바로 접수합니다.
방명록과 같은 Firestore 프로젝트를 쓰며, 컬렉션만 `reports` 로 다릅니다.

저장되는 필드:

| 필드 | 설명 |
| --- | --- |
| `game` | 제보 대상 게임. 드롭다운은 `content.json` 의 다운로드 항목에서 자동으로 만들어집니다 |
| `type` | 진행 불가 / 글자 깨짐 / 번역 수정 / 기타 |
| `title` `body` | 제목(100자)·내용(1000자) |
| `nickname` `patchVersion` | 선택 입력 |
| `status` | 접수 → 확인 중 → 수정 완료 (또는 보류) |
| `createdAt` | 서버 시각 |

### 다운로드 카드 키

| 키 | 쓰임 |
| --- | --- |
| `url` | 버튼 하나 (보통) |
| `parts[]` | 2GiB 를 넘어 쪼갠 파일. **전부** 받아야 한다. 번호 칩 + `partsNote` |
| `variants[]` | 같은 패치의 다른 판본. **하나만** 골라 받는다 (예: 428 의 스팀 번역판 / 자체 번역판) |
| `note` | 카드에 한 줄 안내. `partsNote` 와 달리 어떤 카드에서나 나온다 |

`parts` 가 있으면 `variants` 는 무시된다. 셋 다 없고 `url` 도 비면 '준비 중' 배지가 뜬다.

### 상태 바꾸기

`status` 를 바꾸면 목록의 배지 색이 바뀝니다. 방문자는 보안 규칙으로 막혀 있고,
바꾸는 방법은 두 가지입니다.

- **관리자 모드 (폰에서도 됨):** 제보 탭 맨 아래 작은 **관리** → 구글 로그인.
  등록된 계정이면 각 제보의 상태 배지가 드롭다운으로 바뀌고, 삭제·드라이브 첨부 링크가 보입니다.
  관리자는 `status`(와 `statusAt`)만 바꿀 수 있고 제보 내용은 못 고칩니다.
  **방명록**도 같은 '관리' 로 로그인하면 글마다 삭제가 보입니다(스팸 정리용, 수정은 불가).
  로그인·입구는 `src/admin.jsx` 에 모아 두어 두 화면이 같이 씁니다.
- **Firebase 콘솔:** Firestore Database > `reports` 에서 문서의 `status` 를 직접 수정.

관리자 모드 처음 설정 (한 번만):

1. Firebase 콘솔 > Authentication > 로그인 방법 > **Google** 사용 설정.
2. Authentication > 설정 > 승인된 도메인에 **`wandererb.github.io`** 추가.
3. 사이트 제보 탭에서 **관리**로 로그인하면 "관리자로 등록된 계정이 아니에요 · UID …" 가 나온다.
4. 그 UID 를 `src/content.json` 의 `reports.adminUids` 와 `firestore.rules` 의 `isAdmin()` 목록
   두 곳에 넣고, 규칙을 콘솔에 다시 게시 + 푸시.

### 보안 규칙 (필수)

`firestore.rules` 의 내용을 **Firebase 콘솔 > Firestore Database > 규칙**에 붙여넣고
'게시'해야 제보 화면이 동작합니다. 규칙을 올리기 전에는 목록이
"목록을 불러오지 못했습니다" 로 표시됩니다.

규칙이 막는 것:

- 수정·삭제 전면 금지 (작성만 허용)
- 정해둔 필드 외 거부, 글자 수 상한
- `status` 는 `접수` 로만 생성 가능
- `createdAt` 은 서버 시각만 허용

### 첨부 파일 (구글 드라이브)

사진·세이브 파일은 Apps Script 웹앱(`scripts/report-upload.gs`)이 받아 방랑자 구글 드라이브의
`방랑자 제보 첨부` 폴더에 제보별로 저장합니다. 파일은 비공개(소유자만)이고, 사이트 목록에는
"📎 첨부 N개" 만 보입니다.

1. script.google.com 새 프로젝트에 `scripts/report-upload.gs` 를 붙여넣고 `selfTest` 실행 → 권한 허용
2. 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자) → 웹 앱 URL 복사
3. `src/content.json` 의 `reports.uploadUrl` 에 넣기 (비어 있으면 파일 칸이 숨겨집니다)
4. `firestore.rules` 를 다시 게시 (`attachCount` 허용)

제한(화면·웹앱 양쪽): 사진 JPG·PNG·WEBP 5MB × 5장, 세이브 20MB × 2개, 실행 파일 거부,
하루 총 300MB. 웹앱은 Firestore 에 30분 안에 만들어진 제보가 `attachCount` 로 예고한 개수까지만 받습니다.

스팸 대비로 같은 브라우저에서 1분에 1건만 보내지도록 해두었습니다(`Reports.jsx`).
브라우저 저장소 기반이라 우회는 가능하니, 실제로 문제가 생기면 그때 더 조이면 됩니다.

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 저장소로 push (`main` 브랜치).
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정.
3. 이후 `main` 에 push 할 때마다 `.github/workflows/deploy.yml` 이 자동 빌드·배포.
   - 배포 주소: `https://<사용자>.github.io/<저장소>/`

> `vite.config.js` 의 `base: "./"` 덕분에 저장소 이름과 무관하게(서브경로 포함) 동작합니다.
> Vercel 등 다른 정적 호스팅에 올려도 그대로 동작합니다.

---

## 데이터·개인정보 원칙

- 작업공간 CSV는 **절대 서버로 전송되지 않고** 브라우저(FileReader) 안에서만 분석됩니다.
- 메모·이슈는 브라우저 **IndexedDB**(idb-keyval)에 저장 — 같은 브라우저에서만 보입니다.
- 작업공간은 공개 영역과 분리되어 있으며, 결과물은 필요 시 `content.json` 에 수동으로 옮깁니다.

---

## 선택 확장 (필요해지면)
- 작업공간 비밀번호 보호
- PC↔모바일 데이터 동기화 (경량 백엔드 필요)
- CSV 진행률 히스토리(날짜별 그래프)
