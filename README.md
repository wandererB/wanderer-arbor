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

- `parts` 가 있으면 다운로드 카드에 파트 버튼이 나오고, 합치는 방법 안내문이 자동으로 붙습니다. (`url` 키는 지웁니다)
- 안내문을 바꾸고 싶으면 같은 항목에 `partsNote` 를 넣으면 됩니다.
- 받는 쪽은 파트를 한 폴더에 모아 **.001 을 7-Zip 으로 열거나**, `join.bat` 실행, 또는
  `copy /b "이름.zip.001"+"이름.zip.002" "이름.zip"` 중 아무거나 하면 됩니다.

### 아직 채워야 할 placeholder (더미 데이터)
- [ ] `patch.intro`, `patch.stats` 수치 검증 (현재 29,000행 등은 예시)
- [ ] `changelog` 실제 버전 이력으로 교체 (현재 v0.4.0 등은 예시)
- [ ] `download.url` 실제 Releases 링크 연결

---

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
