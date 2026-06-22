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
