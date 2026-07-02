# Coding AI Assistant

Phind, Cursor Web 같은 개발자 도구를 참고해 만든 코딩 특화 AI 어시스턴트 웹앱입니다. Google Gemini API와 스트리밍으로 통신하며, 마크다운/코드 하이라이팅 렌더링과 로컬 저장 기반 대화 히스토리를 제공합니다.

- **배포 주소**: https://coding-ai-assistant-dusky.vercel.app
- **저장소**: https://github.com/woobin557/coding-ai-assistant

## 기술 스택

- [Next.js](https://nextjs.org) (App Router, Turbopack) + React + TypeScript
- Tailwind CSS v4
- [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`, 무료 티어)
- `react-markdown` + `remark-gfm` (마크다운 렌더링)
- `react-syntax-highlighter` (코드 블록 syntax highlighting)
- `lucide-react` (아이콘)
- Vercel (배포/호스팅)

## 주요 기능

- Gemini API와 스트리밍으로 통신하는 채팅 인터페이스
- 마크다운 렌더링 및 코드 블록 syntax highlighting
- 코드 블록 복사 버튼
- 대화 히스토리 로컬 저장 (localStorage) 및 사이드바로 관리 (새 대화 / 전환 / 삭제)
- 다크모드 기반 IDE 스타일 반응형 UI (모바일에서는 사이드바가 드로어로 전환)

## 구성 (프로젝트 구조)

```
app/
  page.tsx              대화 상태 관리, 사이드바/채팅 영역 조합 (클라이언트 컴포넌트)
  layout.tsx             전역 레이아웃, 다크 테마 기본값, 폰트
  globals.css             Tailwind 설정 및 전역 스타일
  api/chat/route.ts       Gemini로 스트리밍 프록시하는 API 라우트 (서버에서만 실행)
lib/
  ai/
    types.ts               AIProvider 인터페이스 정의
    gemini.ts               Gemini REST API 구현체 (SSE 스트림 파싱 포함)
    index.ts                 현재 활성 provider를 반환하는 진입점
  storage.ts                localStorage 기반 대화 히스토리 CRUD
components/
  ChatWindow.tsx            메시지 목록, 자동 스크롤
  MessageBubble.tsx          말풍선 + 마크다운 렌더링
  CodeBlock.tsx               코드 블록 syntax highlighting + 복사 버튼
  ChatInput.tsx                입력창 (자동 높이 조절, Enter 전송)
  Sidebar.tsx                  대화 히스토리 목록 (모바일에서는 드로어)
hooks/
  useChat.ts                  스트리밍 요청/응답 상태 관리
```

## 작동 원리

1. **메시지 전송**: 사용자가 입력한 메시지를 `useChat` 훅이 받아, 지금까지의 대화 내역과 함께 `POST /api/chat`으로 전송합니다.
2. **서버 프록시**: `app/api/chat/route.ts`가 요청을 받아 `lib/ai`의 `AIProvider`(현재는 `GeminiProvider`)를 통해 Gemini의 `streamGenerateContent` REST 엔드포인트를 SSE(Server-Sent Events) 방식으로 호출합니다. Gemini API 키는 서버에만 있고 클라이언트에는 절대 노출되지 않습니다.
3. **스트림 파싱 및 중계**: `GeminiProvider`는 Gemini가 보내는 SSE 이벤트를 한 줄씩 읽어 `data: {...}` JSON에서 텍스트 조각만 추출한 뒤, 이를 다시 순수 텍스트 스트림으로 클라이언트에 그대로 흘려보냅니다(`ReadableStream`).
4. **클라이언트 수신**: `useChat`은 `fetch` 응답의 `body`를 `getReader()`로 읽어, 도착하는 대로 텍스트 조각을 누적하며 화면의 마지막 assistant 메시지를 실시간으로 갱신합니다. 이 덕분에 타이핑되는 것처럼 보이는 스트리밍 효과가 만들어집니다.
5. **렌더링**: 완성된(또는 계속 갱신되는) 메시지 텍스트는 `react-markdown`으로 파싱되어, 코드 블록은 `CodeBlock` 컴포넌트가, 나머지는 기본 마크다운 컴포넌트가 렌더링합니다.
6. **히스토리 저장**: 메시지가 갱신될 때마다 `lib/storage.ts`가 대화 전체를 `localStorage`에 JSON으로 저장합니다. 대화 제목은 첫 사용자 메시지에서 자동으로 추출됩니다. 새로고침해도 사이드바의 대화 목록과 내용이 유지됩니다.
7. **AI 제공자 교체 구조**: 모든 AI 호출은 `AIProvider` 인터페이스 뒤에 격리되어 있어, 다른 모델(예: Claude API)로 바꾸려면 `lib/ai/`에 새 구현체를 추가하고 `lib/ai/index.ts`에서 인스턴스화 부분만 바꾸면 됩니다. API 라우트나 UI 코드는 전혀 손댈 필요가 없습니다.

## 지원 형식

- **마크다운(GFM)**: 제목, 목록, 표, 굵게/기울임, 링크, 인라인 코드 등 `remark-gfm` 확장 문법까지 지원합니다.
- **코드 syntax highlighting**: `react-syntax-highlighter`(Prism 엔진) 기반으로 JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, HTML/CSS, SQL 등 Prism이 지원하는 대부분의 언어를 인식해 하이라이팅합니다. 언어 태그가 없는 코드 블록은 일반 텍스트로 표시됩니다.
- **다크모드**: 항상 다크 테마 기반으로 동작하는 IDE 스타일 UI입니다.
- **반응형 레이아웃**: 데스크톱/태블릿(≥768px)에서는 사이드바가 항상 보이고, 모바일(<768px)에서는 햄버거 버튼으로 여닫는 드로어로 전환됩니다.

## 자세한 사용법

### 로컬에서 실행하기

```bash
npm install
cp .env.example .env.local
```

`.env.local`을 열어 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받은 API 키를 입력합니다.

```
GEMINI_API_KEY=your_api_key_here
```

개발 서버를 실행합니다.

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 화면 사용법

- **질문 보내기**: 하단 입력창에 질문을 입력하고 `Enter`를 누르면 전송됩니다. `Shift+Enter`는 줄바꿈입니다. 입력창은 내용에 맞춰 자동으로 높이가 늘어납니다.
- **코드 복사**: 코드 블록 우측 상단의 "복사" 버튼을 누르면 클립보드에 코드가 복사됩니다.
- **새 대화 시작**: 왼쪽 사이드바 상단의 "새 대화" 버튼을 누르면 현재 대화 내용이 비워지고, 첫 메시지를 보내는 순간 새 대화가 사이드바 목록에 추가됩니다.
- **대화 전환**: 사이드바에서 이전 대화 제목을 클릭하면 해당 대화로 전환됩니다.
- **대화 삭제**: 사이드바에서 대화 항목에 마우스를 올리면 나타나는 휴지통 아이콘을 누르면 삭제됩니다.
- **모바일에서 사이드바 열기**: 화면이 좁을 때는 사이드바가 숨겨져 있으며, 상단의 햄버거(☰) 버튼을 눌러 열 수 있습니다. 바깥 영역을 누르거나 X 버튼으로 닫습니다.

## 다른 AI 제공자로 교체하기

AI 호출은 `lib/ai`에 격리되어 있습니다. `AIProvider` 인터페이스(`lib/ai/types.ts`)를 구현하는 새 클래스(예: `lib/ai/claude.ts`)를 추가하고, `lib/ai/index.ts`에서 인스턴스화하는 부분만 교체하면 나머지 코드(API 라우트, UI)는 수정할 필요가 없습니다.

## 배포

이 프로젝트는 스트리밍 API 라우트(서버)가 필요해서 정적 호스팅(GitHub Pages 등)이 아닌 [Vercel](https://vercel.com)에 배포되어 있습니다. `GEMINI_API_KEY`는 Vercel 프로젝트의 Production/Preview 환경변수로 등록되어 있으며, GitHub 저장소와 연결되어 있어 `main` 브랜치에 push하면 자동으로 재배포됩니다.
