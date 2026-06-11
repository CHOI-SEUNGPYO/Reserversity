# Reserversity

공간·기자재 예약 관리 데스크톱 애플리케이션 (Electron + React + SQLite)

---

## 기술 스택

| 구분 | 내용 |
|------|------|
| UI | React 19, TypeScript, Tailwind CSS, Radix UI |
| 데스크톱 | Electron 42 |
| DB | SQLite (Prisma ORM) |
| 빌드 | Vite, electron-builder |

---

## 개발 환경 실행

### 사전 요구사항

- Node.js **18 이상** (LTS 권장)
- npm

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. DB 스키마 생성 (최초 1회)
npx prisma generate
npx prisma db push

# 3. 개발 서버 + Electron 실행
npm run dev
```

> 개발 모드에서는 Vite HMR이 활성화되며, DB는 `prisma/dev.db` 파일을 사용합니다.

---

## 배포용 빌드

```bash
npm run build:app
```

빌드가 완료되면 `release/` 폴더에 결과물이 생성됩니다.

| 파일 | 설명 |
|------|------|
| `release/Reserversity 0.0.0.exe` | **배포용 단일 실행 파일** (Portable) |
| `release/win-unpacked/` | 압축 해제된 앱 폴더 (개발/디버그용) |

### 배포 시 주의사항

- **`release/Reserversity 0.0.0.exe` 파일만 전달**하세요. `win-unpacked` 폴더를 압축해서 전달하면 안 됩니다.
- 수신자가 zip에서 압축 해제했다면, exe 파일 **우클릭 → 속성 → "차단 해제" 체크 → 확인** 후 실행하세요.

---

## 앱 데이터 저장 위치

| 환경 | DB 경로 |
|------|---------|
| 개발 | `prisma/dev.db` |
| 배포 (설치 후) | `%APPDATA%\Reserversity\dev.db` |

> 배포된 앱은 최초 실행 시 `%APPDATA%\Reserversity\` 경로에 DB 파일을 자동 생성합니다. 데이터는 앱을 재설치해도 유지됩니다.

---

## 주요 기능

- **대시보드** — 월별 예약 캘린더, 일별 타임테이블 조회
- **신규 예약 등록** — 단일·반복 예약, 시간 중복 자동 감지
- **자원 관리** — 카테고리 및 자원(공간·기자재) CRUD
- **제재 관리** — 규칙 위반 사용자 예약 차단 등록/해제
- **내보내기** — 예약 내역 CSV 파일 저장

---

## 프로젝트 구조

```
code/
├── electron/           # Electron 메인 프로세스
│   ├── main.ts         # 앱 진입점, DB 경로 초기화
│   └── preload.ts      # IPC 채널 노출 (contextBridge)
├── prisma/
│   ├── schema.prisma   # DB 스키마
│   └── dev.db          # SQLite DB 파일
├── src/
│   ├── main/           # 메인 프로세스 비즈니스 로직
│   │   ├── adapters/ipc/handlers.ts  # IPC 핸들러
│   │   ├── domain/                   # 도메인 인터페이스
│   │   ├── infrastructure/           # Prisma 레포지토리
│   │   └── usecases/AppUseCases.ts   # 핵심 유스케이스
│   └── renderer/       # React 렌더러 (UI)
│       ├── components/ui/  # 공통 UI 컴포넌트
│       ├── contexts/       # React Context (예약 상태)
│       └── pages/          # 페이지 컴포넌트
└── release/            # 빌드 결과물 (gitignore)
```

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 + Electron 실행 |
| `npm run build` | TypeScript + Vite + esbuild 빌드 |
| `npm run build:app` | 배포용 exe 빌드 (`npm run build` 포함) |
| `npx prisma generate` | Prisma 클라이언트 재생성 |
| `npx prisma db push` | 스키마를 DB에 적용 |
| `npx prisma studio` | DB 시각화 도구 실행 |
