# Coding AI Assistant

Phind, Cursor Web 같은 개발자 도구를 참고해 만든 코딩 특화 AI 어시스턴트 웹앱입니다. Google Gemini API와 스트리밍으로 통신하며, 마크다운/코드 하이라이팅 렌더링과 로컬 저장 기반 대화 히스토리를 제공합니다.

## 기술 스택

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS
- [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`, 무료 티어)
- `react-markdown` + `remark-gfm` (마크다운 렌더링)
- `react-syntax-highlighter` (코드 블록 syntax highlighting)

## 주요 기능

- Gemini API와 스트리밍으로 통신하는 채팅 인터페이스
- 마크다운 렌더링 및 코드 블록 syntax highlighting
- 코드 블록 복사 버튼
- 대화 히스토리 로컬 저장 (localStorage) 및 사이드바로 관리 (새 대화 / 전환 / 삭제)
- 다크모드 기반 IDE 스타일 반응형 UI (모바일에서는 사이드바가 드로어로 전환)

## 시작하기

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

## 프로젝트 구조

```
app/
  page.tsx           대화 상태 관리, 사이드바/채팅 영역 조합
  api/chat/route.ts   Gemini로 스트리밍 프록시하는 API 라우트
lib/
  ai/                 AI 제공자 추상화 (AIProvider 인터페이스 + Gemini 구현체)
  storage.ts          localStorage 기반 대화 히스토리 CRUD
components/           ChatWindow, MessageBubble, CodeBlock, ChatInput, Sidebar
hooks/useChat.ts       스트리밍 요청/응답 상태 관리
```

## 다른 AI 제공자로 교체하기

AI 호출은 `lib/ai`에 격리되어 있습니다. `AIProvider` 인터페이스(`lib/ai/types.ts`)를 구현하는 새 클래스(예: `lib/ai/claude.ts`)를 추가하고, `lib/ai/index.ts`에서 인스턴스화하는 부분만 교체하면 나머지 코드(API 라우트, UI)는 수정할 필요가 없습니다.
