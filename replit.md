# CodeInterview - Real-time Collaborative Coding Platform

## Overview
A modern platform for conducting online coding interviews with real-time collaboration, syntax highlighting for multiple programming languages, and safe in-browser code execution.

## Current State
**MVP Complete** - The application supports:
- Creating unique shareable interview session links
- Real-time collaborative code editing via WebSocket synchronization
- Syntax highlighting for 8 programming languages (JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust)
- Safe in-browser JavaScript code execution using sandboxed iframes
- Live participant presence indicators with colored avatars
- Share modal for inviting candidates
- Dark/light theme support
- Resizable editor/output panels

## Project Architecture

### Frontend (React + TypeScript)
- **Pages:**
  - `/` - Home page for creating/joining sessions
  - `/session/:sessionId` - Interview page with code editor
- **Key Components:**
  - Monaco Editor for code editing with syntax highlighting
  - WebSocket hook for real-time synchronization
  - Theme provider for dark/light mode
  - Resizable panel layout
- **Code Execution:**
  - Runs in sandboxed iframe (JavaScript only)
  - Other languages show informational message

### Backend (Express + WebSocket)
- **API Endpoints:**
  - `POST /api/sessions` - Create session
  - `GET /api/sessions/:id` - Get session
- **WebSocket Messages:**
  - `join` - Join a session
  - `code_update` - Sync code changes
  - `language_change` - Change programming language
  - `cursor_update` - Update cursor position
  - `session_state` - Receive full session state
  - `participant_joined/left` - Presence updates

### Storage
- In-memory storage for sessions and participants
- Sessions store: code, language, timestamp
- Participants store: name, color, cursor position

## File Structure
```
client/src/
├── pages/
│   ├── home.tsx          # Landing page
│   └── interview.tsx     # Interview room
├── components/
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── hooks/
│   └── use-websocket.ts  # WebSocket connection
├── lib/
│   └── code-executor.ts  # Safe JS execution
└── App.tsx

server/
├── routes.ts             # API + WebSocket server
└── storage.ts            # In-memory storage

shared/
└── schema.ts             # Types and schemas
```

## User Preferences
- Dark theme enabled by default
- Inter font for UI, JetBrains Mono for code
- Minimal, distraction-free interface

## Development Commands
- `npm run dev` - Start development server
- Application runs on port 5000

## Recent Changes
- Moved code execution from server to client-side sandboxed iframe for security
- Added support for 8 programming languages with code templates
- Implemented real-time cursor tracking and participant presence
